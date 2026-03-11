def cardiac_score(hr, rmssd):

    score = (rmssd * 10) - (hr / 2)

    if score < 0:
        score = 0

    if score > 100:
        score = 100

    return round(score,2)