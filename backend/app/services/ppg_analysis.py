from app.signal_processing.ppg_preprocessing import normalize_signal
from app.signal_processing.ppg_filter import bandpass_filter
from app.signal_processing.peak_detection import detect_peaks
from app.signal_processing.hrv_features import compute_rr_intervals, compute_hr, compute_rmssd
from app.models.cardiac_model import cardiac_score
import numpy as np


def analyze_ppg(signal, fs=100, baseline=None):

    signal = np.array(signal, dtype=float)

    if signal.size == 0:
        return {"error": "No signal received"}

    # remove DC offset
    signal = signal - np.mean(signal)

    normalized = normalize_signal(signal)

    filtered = np.array(bandpass_filter(normalized, fs=fs), dtype=float)

    # Basic Signal Quality Index (SQI)
    signal_amplitude = np.max(filtered) - np.min(filtered)

    if signal_amplitude < 0.02:
        return {
            "error": "Poor signal quality",
            "signal_quality": "bad"
        }

    peaks = detect_peaks(filtered, fs=fs)

    if len(peaks) < 3:
        return {
            "error": "Signal too short or noisy",
            "peaks_detected": len(peaks)
        }

    rr = compute_rr_intervals(peaks, fs=fs)

    if len(rr) == 0:
        return {
            "error": "RR interval calculation failed"
        }

    hr = compute_hr(rr)

    rmssd = compute_rmssd(rr)

    if np.isnan(hr) or np.isnan(rmssd):
        return {
            "error": "Invalid HRV calculation"
        }

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
        "signal_quality": "good",
        "baseline_hr": baseline.get("baseline_hr"),
        "baseline_rmssd": baseline.get("baseline_rmssd"),
        "hr_delta_from_baseline": None if baseline.get("baseline_hr") is None else round(hr - baseline.get("baseline_hr"), 2),
        "rmssd_delta_from_baseline": None if baseline.get("baseline_rmssd") is None else round(rmssd - baseline.get("baseline_rmssd"), 3),
    }
