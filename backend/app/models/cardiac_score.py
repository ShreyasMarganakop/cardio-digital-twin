def cardiac_score(hrv):

    score = hrv * 10

    if score > 100:
        score = 100

    return round(score,2)