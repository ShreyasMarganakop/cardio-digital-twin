from scipy.signal import butter, filtfilt
import numpy as np

def bandpass_filter(signal, fs=100):

    signal = np.array(signal)

    if len(signal) < 20 or fs <= 0:
        return signal.tolist()

    low = 0.5
    high = 4.0

    if high >= fs / 2:
        high = (fs / 2) - 0.1

    if low >= high:
        return signal.tolist()

    b, a = butter(2, [low/(fs/2), high/(fs/2)], btype='band')

    filtered = filtfilt(b, a, signal)

    return filtered.tolist()
