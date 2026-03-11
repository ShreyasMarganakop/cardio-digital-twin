def cardiac_score(hr, rmssd, baseline_hr=None, baseline_rmssd=None):
    score = 50.0

    if baseline_hr is not None and baseline_rmssd is not None:
        hr_delta = baseline_hr - hr
        rmssd_delta = rmssd - baseline_rmssd
        score += (hr_delta * 0.8) + (rmssd_delta * 1.2)
    else:
        score += (rmssd - 30) * 1.5
        score -= (hr - 70) * 0.7

    if score < 0:
        score = 0

    if score > 100:
        score = 100

    return round(score,2)
