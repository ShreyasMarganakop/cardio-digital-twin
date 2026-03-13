import numpy as np

def compute_rr_intervals(peaks, fs=100):

    if len(peaks) < 2 or fs <= 0:
        return np.array([])

    rr = np.diff(peaks) / fs

    return rr


def clean_rr_intervals(rr, min_rr=0.4, max_rr=1.5, mad_scale=3.0):

    rr = np.array(rr, dtype=float)

    if len(rr) == 0:
        return np.array([])

    # Keep only physiologically plausible beat intervals.
    rr = rr[(rr >= min_rr) & (rr <= max_rr)]

    if len(rr) < 3:
        return rr

    median_rr = np.median(rr)
    absolute_deviation = np.abs(rr - median_rr)
    mad = np.median(absolute_deviation)

    if mad == 0:
        tolerance = max(0.12, median_rr * 0.2)
        return rr[absolute_deviation <= tolerance]

    robust_z = 0.6745 * absolute_deviation / mad
    return rr[robust_z <= mad_scale]


def compute_hr(rr):

    if len(rr) == 0:
        return float("nan")

    hr = 60 / np.mean(rr)

    return float(hr)


def compute_rmssd(rr):

    if len(rr) < 2:
        return float("nan")

    diff = np.diff(rr)

    rmssd = np.sqrt(np.mean(diff**2)) * 1000.0

    return float(rmssd)
