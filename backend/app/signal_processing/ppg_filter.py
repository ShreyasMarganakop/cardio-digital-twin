from scipy.signal import butter, filtfilt, medfilt
import numpy as np


def detrend_signal(signal, kernel_size=31):

    signal = np.array(signal, dtype=float)

    if len(signal) < 5:
        return signal.tolist()

    if kernel_size % 2 == 0:
        kernel_size += 1

    kernel_size = min(kernel_size, len(signal) if len(signal) % 2 == 1 else len(signal) - 1)
    if kernel_size < 3:
        return signal.tolist()

    baseline = medfilt(signal, kernel_size=kernel_size)

    return (signal - baseline).tolist()


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


def moving_average_smooth(signal, window_size=5):

    signal = np.array(signal, dtype=float)

    if len(signal) < window_size or window_size <= 1:
        return signal.tolist()

    window = np.ones(window_size, dtype=float) / window_size
    smoothed = np.convolve(signal, window, mode="same")

    return smoothed.tolist()
