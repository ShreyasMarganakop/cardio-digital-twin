from app.signal_processing.ppg_preprocessing import normalize_signal
from app.signal_processing.ppg_filter import bandpass_filter
from app.signal_processing.peak_detection import detect_peaks
from app.signal_processing.hrv_features import compute_rr_intervals, compute_hr, compute_rmssd
from app.models.cardiac_model import cardiac_score
import numpy as np


def analyze_ppg(signal):

    normalized = normalize_signal(signal)

    filtered = bandpass_filter(normalized)

    filtered = np.clip(filtered, -3, 3)   # NEW LINE

    peaks = detect_peaks(filtered)

    if len(peaks) < 3:
        return {
            "error": "Signal too short or noisy",
            "peaks_detected": len(peaks)
        }

    rr = compute_rr_intervals(peaks)

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

    score = cardiac_score(hr, rmssd)

    return {
        "heart_rate": round(hr,2),
        "rmssd": round(rmssd,3),
        "cardiac_score": score,
        "peaks": peaks
    }