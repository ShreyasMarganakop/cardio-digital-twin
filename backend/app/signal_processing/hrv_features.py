import numpy as np

def compute_rr_intervals(peaks, fs=100):

    if len(peaks) < 2 or fs <= 0:
        return np.array([])

    rr = np.diff(peaks) / fs

    return rr


def compute_hr(rr):

    if len(rr) == 0:
        return float("nan")

    hr = 60 / np.mean(rr)

    return float(hr)


def compute_rmssd(rr):

    if len(rr) < 2:
        return float("nan")

    diff = np.diff(rr)

    rmssd = np.sqrt(np.mean(diff**2))

    return float(rmssd)
