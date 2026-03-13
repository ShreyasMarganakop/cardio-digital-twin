import numpy as np
from scipy.signal import find_peaks

def detect_peaks(signal, fs=100):

    signal = np.array(signal, dtype=float)

    if signal.size < 3:
        return []

    min_distance = max(1, int(fs * 0.4))
    signal_range = float(np.max(signal) - np.min(signal))
    prominence = max(signal_range * 0.18, 0.05)
    height = float(np.mean(signal))

    peaks, _ = find_peaks(
        signal,
        distance=min_distance,
        prominence=prominence,
        height=height,
    )

    return peaks.tolist()
