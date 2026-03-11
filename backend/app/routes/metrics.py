from fastapi import APIRouter
from datetime import datetime, timedelta
import pytz
import logging

logging.basicConfig(level=logging.INFO)

from app.database.mongodb import db
from app.services.ppg_analysis import analyze_ppg
from app.services.baseline import build_user_baseline, fetch_recent_measurements
from app.services.recommendation import generate_recommendation
from app.services.simulation import simulate_strategy
from app.schemas.ppg_schema import PPGSignal, SimulationInput

router = APIRouter(prefix="/api")

collection = db["ppg_measurements"]

ist = pytz.timezone("Asia/Kolkata")


# -----------------------------
# Receive PPG Signal
# -----------------------------
@router.post("/ppg")
def receive_ppg(data: PPGSignal):

    signal = data.signal
    sampling_rate = data.sampling_rate
    user_id = data.user_id
    session_type = data.session_type
    activity_load = data.activity_load
    stress_level = data.stress_level

    # 1️⃣ No signal
    if not signal:
        return {"error": "No signal received"}

    # 2️⃣ Too short
    if len(signal) < 30:
        return {"error": "Signal too short"}

    # 3️⃣ Invalid sampling rate
    if sampling_rate <= 0:
        return {"error": "Invalid sampling rate"}

    # 4️⃣ Poor quality
    if max(signal) - min(signal) <= 0:
        return {"error": "Poor signal quality"}

    baseline = build_user_baseline(
        collection,
        now=datetime.now(ist),
        user_id=user_id,
        session_type=session_type,
    )

    try:
        result = analyze_ppg(signal, fs=sampling_rate, baseline=baseline)

    except Exception as e:
        logging.error(e)
        return {"error": "Signal processing failed"}

    if "error" in result:
        return result

    document = {
        "timestamp": datetime.now(ist),
        "heart_rate": result.get("heart_rate", 0),
        "rmssd": result.get("rmssd", 0),
        "cardiac_score": result.get("cardiac_score", 0),
        "user_id": user_id,
        "session_type": session_type,
        "activity_load": activity_load,
        "stress_level": stress_level,
        "baseline_hr": result.get("baseline_hr"),
        "baseline_rmssd": result.get("baseline_rmssd"),
        "hr_delta_from_baseline": result.get("hr_delta_from_baseline"),
        "rmssd_delta_from_baseline": result.get("rmssd_delta_from_baseline"),
        "sampling_rate": sampling_rate,
        "signal_length": len(signal),
        "signal": signal
    }

    collection.insert_one(document)

    document["_id"] = str(document["_id"])

    return document


# -----------------------------
# History API
# -----------------------------
@router.get("/history")
def get_history(user_id: str = "default-user", session_type: str | None = None):

    data = []

    query = {"user_id": user_id}
    if session_type:
        query["session_type"] = session_type

    for item in collection.find(query, {"_id": 0}).sort("timestamp", -1).limit(20):

        data.append({
            "timestamp": item["timestamp"],
            "heart_rate": item["heart_rate"],
            "rmssd": item["rmssd"],
            "cardiac_score": item["cardiac_score"],
            "signal_length": item["signal_length"],
            "session_type": item.get("session_type", "resting"),
            "activity_load": item.get("activity_load", 0),
        })

    return data


# -----------------------------
# Latest Measurement
# -----------------------------
@router.get("/latest")
def get_latest(user_id: str = "default-user", session_type: str | None = None):

    query = {"user_id": user_id}
    if session_type:
        query["session_type"] = session_type

    item = collection.find_one(query, sort=[("timestamp", -1)])

    if not item:
        return {"error": "no data"}

    item["_id"] = str(item["_id"])

    return item


# -----------------------------
# Range Based History
# -----------------------------
@router.get("/history/{range}")
def history_range(range: str, user_id: str = "default-user", session_type: str | None = None):

    now = datetime.now(ist)

    if range == "daily":
        start = now - timedelta(hours=24)

    elif range == "weekly":
        start = now - timedelta(days=7)

    elif range == "monthly":
        start = now - timedelta(days=30)

    else:
        return {"error": "invalid range"}

    data = []

    query = {"timestamp": {"$gte": start}, "user_id": user_id}
    if session_type:
        query["session_type"] = session_type

    cursor = collection.find(query, {"_id": 0}).sort("timestamp", 1)

    for item in cursor:
        data.append(item)

    return data


@router.post("/simulate")
def simulate_training(input_data: SimulationInput):

    query = {"user_id": input_data.user_id}
    if input_data.session_type:
        query["session_type"] = input_data.session_type

    latest = collection.find_one(query, sort=[("timestamp", -1)])

    if not latest:
        return {"error": "no data"}

    recent = fetch_recent_measurements(
        collection,
        now=datetime.now(ist),
        limit=20,
        user_id=input_data.user_id,
        session_type=input_data.session_type,
    )
    baseline = build_user_baseline(
        collection,
        now=datetime.now(ist),
        fallback_hr=latest.get("heart_rate"),
        fallback_rmssd=latest.get("rmssd"),
        fallback_score=latest.get("cardiac_score"),
        user_id=input_data.user_id,
        session_type=input_data.session_type,
    )

    result = simulate_strategy(
        latest_measurement=latest,
        recent_measurements=recent,
        strategy=input_data.strategy,
        activity_load=input_data.activity_load,
        stress_level=input_data.stress_level,
        baseline=baseline,
    )

    return result


@router.get("/recommendation")
def get_recommendation(
    user_id: str = "default-user",
    session_type: str | None = None,
    activity_load: int | None = None,
    stress_level: int | None = None,
):

    query = {"user_id": user_id}
    if session_type:
        query["session_type"] = session_type

    latest = collection.find_one(query, sort=[("timestamp", -1)])

    if not latest:
        return {"error": "no data"}

    recent = fetch_recent_measurements(
        collection,
        now=datetime.now(ist),
        limit=20,
        user_id=user_id,
        session_type=session_type,
    )
    baseline = build_user_baseline(
        collection,
        now=datetime.now(ist),
        fallback_hr=latest.get("heart_rate"),
        fallback_rmssd=latest.get("rmssd"),
        fallback_score=latest.get("cardiac_score"),
        user_id=user_id,
        session_type=session_type,
    )

    return generate_recommendation(
        latest_measurement=latest,
        recent_measurements=recent,
        baseline=baseline,
        activity_load=activity_load,
        stress_level=stress_level,
    )
