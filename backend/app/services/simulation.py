def clamp(value, lower, upper):
    return max(lower, min(upper, value))


def simulate_strategy(latest_measurement, recent_measurements, strategy, activity_load=50, stress_level=50, baseline=None):
    if not latest_measurement:
        return {"error": "No data available for simulation"}

    hr = float(latest_measurement.get("heart_rate", 0))
    rmssd = float(latest_measurement.get("rmssd", 0))
    current_score = float(latest_measurement.get("cardiac_score", 0))

    if hr <= 0 or rmssd < 0:
        return {"error": "Latest measurement is invalid for simulation"}

    baseline = baseline or {}
    recent_scores = [
        float(item.get("cardiac_score", 0))
        for item in recent_measurements
        if item.get("cardiac_score") is not None
    ]
    baseline_score = float(baseline.get("baseline_score", sum(recent_scores) / len(recent_scores) if recent_scores else current_score))
    baseline_hr = float(baseline.get("baseline_hr", hr))
    baseline_rmssd = float(baseline.get("baseline_rmssd", rmssd))

    strategy_effects = {
        "exercise": {"base_delta": 2.0, "recovery_bias": -0.5, "load_bias": 0.02, "stress_bias": -0.02},
        "interval": {"base_delta": 4.5, "recovery_bias": -1.2, "load_bias": 0.03, "stress_bias": -0.04},
        "breathing": {"base_delta": 3.0, "recovery_bias": 0.8, "load_bias": -0.01, "stress_bias": 0.03},
        "recovery": {"base_delta": 3.5, "recovery_bias": 1.4, "load_bias": -0.03, "stress_bias": 0.02},
    }

    if strategy not in strategy_effects:
        return {"error": "Invalid strategy"}

    profile = strategy_effects[strategy]
    recovery_signal = clamp((rmssd - baseline_rmssd) / 15, -1, 1)
    heart_strain = clamp((hr - baseline_hr) / 20, -1, 1)
    trend_signal = clamp((current_score - baseline_score) / 15, -1, 1)
    normalized_load = clamp((activity_load - 50) / 50, -1, 1)
    normalized_stress = clamp((stress_level - 50) / 50, -1, 1)

    delta = (
        profile["base_delta"]
        + (profile["recovery_bias"] * recovery_signal)
        - (heart_strain * 1.5)
        + (trend_signal * 1.0)
        + (profile["load_bias"] * activity_load)
        + (profile["stress_bias"] * stress_level)
    )

    predicted_score = clamp(round(current_score + delta, 2), 0, 100)
    score_change = round(predicted_score - current_score, 2)

    explanation = []
    if rmssd < baseline_rmssd - 10:
        explanation.append("RMSSD is well below your recent baseline, which suggests incomplete recovery.")
    elif rmssd < baseline_rmssd:
        explanation.append("RMSSD is slightly below your recent baseline, so recovery looks reduced.")
    else:
        explanation.append("RMSSD is at or above your recent baseline, which supports adaptation and recovery.")

    if hr > baseline_hr + 15:
        explanation.append("Heart rate is clearly above your recent baseline, indicating higher current cardiac strain.")
    elif hr > baseline_hr + 5:
        explanation.append("Heart rate is somewhat above your recent baseline, which suggests mild strain.")
    else:
        explanation.append("Heart rate is close to or below your recent baseline, which lowers immediate cardiac strain.")

    if current_score >= baseline_score:
        explanation.append("Your current score is at or above recent baseline, so the model allows modest progression.")
    else:
        explanation.append("Your current score is below recent baseline, so the model discounts aggressive strategies.")

    strategy_explanations = {
        "exercise": "Light exercise produces a small gain and is suitable when you want low-risk progression.",
        "interval": "Interval training offers the largest upside, but only when recovery and strain markers are supportive.",
        "breathing": "Breathing practice mainly helps by reducing stress pressure and improving autonomic balance.",
        "recovery": "Recovery optimization helps most when strain is elevated or HRV is suppressed.",
    }
    explanation.append(strategy_explanations[strategy])

    safety_alerts = []
    if hr > baseline_hr + 20:
        safety_alerts.append("Heart rate is far above baseline: avoid hard training until readings settle.")
    if rmssd < baseline_rmssd - 12:
        safety_alerts.append("RMSSD is materially below baseline: prioritize recovery before interval work.")
    if strategy == "interval" and (hr > baseline_hr + 10 or rmssd < baseline_rmssd - 8 or normalized_stress > 0.3):
        safety_alerts.append("Interval training is not the safest choice under the current recovery and stress state.")
    if normalized_load > 0.6 and strategy in {"interval", "exercise"}:
        safety_alerts.append("Recent activity load is already high, so additional load should be conservative.")

    recommendation = "Proceed"
    if safety_alerts:
        recommendation = "Use caution"
    if len(safety_alerts) >= 2:
        recommendation = "Recovery first"

    return {
        "strategy": strategy,
        "current_score": round(current_score, 2),
        "baseline_score": round(baseline_score, 2),
        "baseline_hr": round(baseline_hr, 2),
        "baseline_rmssd": round(baseline_rmssd, 2),
        "predicted_score": predicted_score,
        "score_change": score_change,
        "activity_load": activity_load,
        "stress_level": stress_level,
        "recommendation": recommendation,
        "explanation": explanation,
        "safety_alerts": safety_alerts,
        "trend": [round(current_score, 2), predicted_score],
    }
