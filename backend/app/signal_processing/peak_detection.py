from scipy.signal import find_peaks

def detect_peaks(signal):

    peaks, _ = find_peaks(signal, distance=10)

    return peaks.tolist()