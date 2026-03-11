from scipy.signal import find_peaks

def detect_peaks(signal, fs=100):

    min_distance = max(1, int(fs * 0.4))
    peaks, _ = find_peaks(signal, distance=min_distance)

    return peaks.tolist()
