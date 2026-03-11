import numpy as np

def compute_rr_intervals(peaks, fs=30):

    rr = np.diff(peaks)

    rr = rr / fs   # convert frames → seconds

    return rr


def compute_hr(rr):

    hr = 60 / np.mean(rr)

    return float(hr)


def compute_rmssd(rr):

    diff = np.diff(rr)

    rmssd = np.sqrt(np.mean(diff**2))

    return float(rmssd)