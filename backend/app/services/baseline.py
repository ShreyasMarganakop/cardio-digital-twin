from datetime import timedelta


def _safe_average(values, fallback):
    valid_values = [float(value) for value in values if value is not None]
    if not valid_values:
        return fallback
    return sum(valid_values) / len(valid_values)


def build_baseline_from_measurements(measurements, fallback_hr=None, fallback_rmssd=None, fallback_score=None):
    hr_values = [item.get("heart_rate") for item in measurements]
    rmssd_values = [item.get("rmssd") for item in measurements]
    score_values = [item.get("cardiac_score") for item in measurements]

    baseline_hr = _safe_average(hr_values, fallback_hr if fallback_hr is not None else 75.0)
    baseline_rmssd = _safe_average(rmssd_values, fallback_rmssd if fallback_rmssd is not None else 30.0)
    baseline_score = _safe_average(score_values, fallback_score if fallback_score is not None else 50.0)

    return {
        "baseline_hr": round(baseline_hr, 2),
        "baseline_rmssd": round(baseline_rmssd, 2),
        "baseline_score": round(baseline_score, 2),
        "sample_count": len(measurements),
    }


def fetch_recent_measurements(collection, now, days=7, limit=50, user_id=None, session_type=None):
    start = now - timedelta(days=days)
    query = {"timestamp": {"$gte": start}}
    if user_id:
        query["user_id"] = user_id
    if session_type:
        query["session_type"] = session_type

    return list(
        collection.find(
            query,
            {
                "_id": 0,
                "heart_rate": 1,
                "rmssd": 1,
                "cardiac_score": 1,
                "timestamp": 1,
                "user_id": 1,
                "session_type": 1,
                "activity_load": 1,
                "stress_level": 1,
            },
        )
        .sort("timestamp", -1)
        .limit(limit)
    )


def build_user_baseline(collection, now, fallback_hr=None, fallback_rmssd=None, fallback_score=None, user_id=None, session_type=None):
    recent_measurements = fetch_recent_measurements(
        collection,
        now=now,
        user_id=user_id,
        session_type=session_type,
    )
    baseline = build_baseline_from_measurements(
        recent_measurements,
        fallback_hr=fallback_hr,
        fallback_rmssd=fallback_rmssd,
        fallback_score=fallback_score,
    )
    baseline["user_id"] = user_id
    baseline["session_type"] = session_type or "all"
    return baseline
