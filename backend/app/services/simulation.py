def clamp(value, lower, upper):
    return max(lower, min(upper, value))


def describe_band(value, low_cutoff=35, high_cutoff=65, low_label="low", mid_label="moderate", high_label="high"):
    if value <= low_cutoff:
        return low_label
    if value >= high_cutoff:
        return high_label
    return mid_label


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
    load_band = describe_band(activity_load)
    stress_band = describe_band(stress_level)

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

    if activity_load >= 70:
        explanation.append("Recent activity load is high, so your system is already carrying substantial training strain.")
    elif activity_load <= 30:
        explanation.append("Recent activity load is light, so you have more room for progression if recovery markers agree.")
    else:
        explanation.append("Recent activity load is moderate, so the recommendation balances adaptation and recovery.")

    if stress_level >= 70:
        explanation.append("Stress level is high, which reduces tolerance for aggressive strategies even if the score is acceptable.")
    elif stress_level <= 30:
        explanation.append("Stress level is low, which supports better tolerance for training progression.")
    else:
        explanation.append("Stress level is moderate, so the model avoids overly aggressive predictions.")

    if current_score >= baseline_score:
        explanation.append("Your current score is at or above recent baseline, so the model allows modest progression.")
    else:
        explanation.append("Your current score is below recent baseline, so the model discounts aggressive strategies.")

    strategy_titles = {
        "exercise": "Light exercise",
        "interval": "Interval training",
        "breathing": "Breathing practice",
        "recovery": "Recovery optimization",
    }

    strategy_explanations = {
        "exercise": {
            "favorable": "Light exercise is a reasonable choice here because it can improve fitness without adding extreme strain.",
            "guarded": "Light exercise is still possible, but the gain is limited because recovery and strain markers are not fully supportive.",
        },
        "interval": {
            "favorable": "Interval training is only favored when recovery is strong, stress is controlled, and heart strain is low.",
            "guarded": "Interval training is penalized here because the current load, stress, or recovery state makes it less safe.",
        },
        "breathing": {
            "favorable": "Breathing practice is favored when lowering stress can unlock better recovery without adding physical load.",
            "guarded": "Breathing practice remains useful here because it reduces autonomic strain even when hard training is not ideal.",
        },
        "recovery": {
            "favorable": "Recovery optimization is effective here because it improves readiness without adding more workload.",
            "guarded": "Recovery optimization is strongly favored because current markers suggest you should restore before pushing harder.",
        },
    }

    favorable_context = (
        rmssd >= baseline_rmssd
        and hr <= baseline_hr + 5
        and activity_load <= 50
        and stress_level <= 50
    )
    explanation.append(
        f"Selected strategy: {strategy_titles[strategy]} with activity load {activity_load} and stress level {stress_level}."
    )
    explanation.append(
        strategy_explanations[strategy]["favorable" if favorable_context else "guarded"]
    )

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

    if strategy == "interval":
        if stress_level >= 70 or activity_load >= 70:
            recommendation = "Recovery first"
        elif rmssd >= baseline_rmssd and hr <= baseline_hr + 5:
            recommendation = "Proceed"
    elif strategy == "breathing":
        if stress_level >= 50:
            recommendation = "Proceed"
    elif strategy == "recovery":
        if activity_load >= 50 or stress_level >= 50 or hr > baseline_hr + 5:
            recommendation = "Proceed"
    elif strategy == "exercise":
        if activity_load >= 70 or stress_level >= 70:
            recommendation = "Use caution"

    context_summary = (
        f"Current context: {load_band} activity load, {stress_band} stress, "
        f"HR {round(hr, 2)} vs baseline {round(baseline_hr, 2)}, "
        f"RMSSD {round(rmssd, 2)} vs baseline {round(baseline_rmssd, 2)}."
    )

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
        "context_summary": context_summary,
        "explanation": explanation,
        "safety_alerts": safety_alerts,
        "trend": [round(current_score, 2), predicted_score],
    }
