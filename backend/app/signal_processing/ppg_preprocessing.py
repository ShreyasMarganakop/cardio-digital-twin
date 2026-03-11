import numpy as np

def normalize_signal(signal):

    signal = np.array(signal)
    signal = signal - np.mean(signal)

    signal = (signal - np.mean(signal)) / np.std(signal)

    return signal.tolist()