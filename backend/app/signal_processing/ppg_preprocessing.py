import numpy as np

def normalize_signal(signal):

    signal = np.array(signal)
    signal = signal - np.mean(signal)

    std = np.std(signal)
    if std == 0:
        return signal.tolist()

    signal = signal / std

    return signal.tolist()
