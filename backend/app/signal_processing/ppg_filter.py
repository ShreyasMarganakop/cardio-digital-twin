from scipy.signal import butter, filtfilt
import numpy as np

def bandpass_filter(signal, fs=30):

    signal = np.array(signal)

    if len(signal) < 20:
        return signal.tolist()

    low = 0.5
    high = 4.0

    b, a = butter(2, [low/(fs/2), high/(fs/2)], btype='band')

    filtered = filtfilt(b, a, signal)

    return filtered.tolist()