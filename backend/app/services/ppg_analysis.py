from app.signal_processing.ppg_preprocessing import normalize_signal
from app.signal_processing.ppg_filter import bandpass_filter, detrend_signal, moving_average_smooth
from app.signal_processing.peak_detection import detect_peaks
from app.signal_processing.hrv_features import clean_rr_intervals, compute_rr_intervals, compute_hr, compute_rmssd
from app.models.cardiac_model import cardiac_score
import numpy as np


def _prepare_display_signal(signal):

    signal = np.array(signal, dtype=float)

    if signal.size == 0:
        return []

    centered = signal - np.mean(signal)
    scale = np.max(np.abs(centered))

    if scale == 0:
        return centered.tolist()

    normalized = centered / scale

    return normalized.tolist()


def analyze_ppg(signal, fs=100, baseline=None):

    signal = np.array(signal, dtype=float)

    if signal.size == 0:
        return {"error": "No signal received"}

    if signal.size < max(150, int(fs * 4)):
        return {"error": "Signal too short"}

    # remove DC offset and broad baseline drift first
    signal = signal - np.mean(signal)
    detrended = np.array(detrend_signal(signal, kernel_size=max(21, int(fs * 0.6) | 1)), dtype=float)

    normalized = normalize_signal(detrended)

    filtered = np.array(bandpass_filter(normalized, fs=fs), dtype=float)
    smoothed = np.array(moving_average_smooth(filtered, window_size=max(3, int(fs * 0.08) | 1)), dtype=float)

    # Basic Signal Quality Index (SQI)
    signal_amplitude = np.max(smoothed) - np.min(smoothed)
    zero_crossings = np.sum(np.diff(np.signbit(smoothed)) != 0)
    if zero_crossings < 4:
        return {
            "error": "Sensor not properly placed",
            "signal_quality": "bad"
        }

    if signal_amplitude < 0.02:
        return {
            "error": "Poor signal quality",
            "signal_quality": "bad"
        }

    peaks = detect_peaks(smoothed, fs=fs)

    if len(peaks) < 3:
        return {
            "error": "Signal too short or noisy",
            "peaks_detected": len(peaks)
        }

    rr = compute_rr_intervals(peaks, fs=fs)
    cleaned_rr = clean_rr_intervals(rr)

    if len(cleaned_rr) < 3:
        return {
            "error": "Signal too noisy for reliable HRV"
        }

    hr = compute_hr(cleaned_rr)

    rmssd = compute_rmssd(cleaned_rr)

    if np.isnan(hr) or np.isnan(rmssd):
        return {
            "error": "Invalid HRV calculation"
        }

    # Reject batches where interval variability is implausibly large for a short resting window.
    rr_spread_ms = (np.max(cleaned_rr) - np.min(cleaned_rr)) * 1000.0
    if rr_spread_ms > 450:
        return {
            "error": "Signal too noisy for reliable HRV"
        }

    # Cap clearly unrealistic values to keep downstream score/recommendation stable.
    rmssd = min(rmssd, 180.0)

    baseline = baseline or {}
    score = cardiac_score(
        hr,
        rmssd,
        baseline_hr=baseline.get("baseline_hr"),
        baseline_rmssd=baseline.get("baseline_rmssd"),
    )

    return {
        "heart_rate": round(hr, 2),
        "rmssd": round(rmssd, 3),
        "cardiac_score": score,
        "peaks": peaks,
        "valid_rr_count": int(len(cleaned_rr)),
        "processed_signal": [round(value, 4) for value in _prepare_display_signal(smoothed)],
        "signal_quality": "good",
        "baseline_hr": baseline.get("baseline_hr"),
        "baseline_rmssd": baseline.get("baseline_rmssd"),
        "hr_delta_from_baseline": None if baseline.get("baseline_hr") is None else round(hr - baseline.get("baseline_hr"), 2),
        "rmssd_delta_from_baseline": None if baseline.get("baseline_rmssd") is None else round(rmssd - baseline.get("baseline_rmssd"), 3),
    }
