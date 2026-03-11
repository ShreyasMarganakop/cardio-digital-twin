from app.services.simulation import simulate_strategy


RECOMMENDATION_PRIORITY = {
    "Proceed": 0,
    "Use caution": 1,
    "Recovery first": 2,
}


def generate_recommendation(latest_measurement, recent_measurements, baseline, activity_load=None, stress_level=None):
    if not latest_measurement:
        return {"error": "No data available for recommendation"}

    resolved_activity_load = activity_load
    if resolved_activity_load is None:
        resolved_activity_load = int(latest_measurement.get("activity_load", 0))

    resolved_stress_level = stress_level
    if resolved_stress_level is None:
        resolved_stress_level = int(latest_measurement.get("stress_level", 50))

    strategies = ["exercise", "interval", "breathing", "recovery"]
    simulations = []

    for strategy in strategies:
        result = simulate_strategy(
            latest_measurement=latest_measurement,
            recent_measurements=recent_measurements,
            strategy=strategy,
            activity_load=resolved_activity_load,
            stress_level=resolved_stress_level,
            baseline=baseline,
        )

        if "error" not in result:
            simulations.append(result)

    if not simulations:
        return {"error": "Unable to generate recommendation"}

    best_result = min(
        simulations,
        key=lambda item: (
            RECOMMENDATION_PRIORITY.get(item["recommendation"], 99),
            -item["predicted_score"],
        ),
    )

    current_score = float(best_result["current_score"])
    baseline_score = float(best_result["baseline_score"])
    score_gap = round(current_score - baseline_score, 2)

    summary_reason = []
    if score_gap >= 0:
        summary_reason.append("Current score is at or above recent baseline.")
    else:
        summary_reason.append("Current score is below recent baseline.")

    if latest_measurement.get("rmssd_delta_from_baseline") is not None and latest_measurement["rmssd_delta_from_baseline"] < 0:
        summary_reason.append("Recovery markers are below baseline.")

    if latest_measurement.get("hr_delta_from_baseline") is not None and latest_measurement["hr_delta_from_baseline"] > 0:
        summary_reason.append("Heart rate is above baseline.")

    if not summary_reason:
        summary_reason.append("Current physiology is close to baseline.")

    alternatives = [
        {
            "strategy": item["strategy"],
            "predicted_score": item["predicted_score"],
            "recommendation": item["recommendation"],
        }
        for item in sorted(
            simulations,
            key=lambda item: (
                RECOMMENDATION_PRIORITY.get(item["recommendation"], 99),
                -item["predicted_score"],
            ),
        )
    ]

    safety_status = "stable"
    if best_result["recommendation"] == "Use caution":
        safety_status = "caution"
    if best_result["recommendation"] == "Recovery first":
        safety_status = "elevated_risk"

    return {
        "recommended_action": best_result["strategy"],
        "safety_status": safety_status,
        "current_score": current_score,
        "baseline_score": baseline_score,
        "predicted_score": best_result["predicted_score"],
        "activity_load": resolved_activity_load,
        "stress_level": resolved_stress_level,
        "recommendation": best_result["recommendation"],
        "summary_reason": summary_reason,
        "explanation": best_result["explanation"],
        "safety_alerts": best_result["safety_alerts"],
        "alternatives": alternatives,
    }
