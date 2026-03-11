from fastapi import APIRouter
from datetime import datetime
import pytz

from app.database.mongodb import db
from app.services.ppg_analysis import analyze_ppg

router = APIRouter(prefix="/api")

collection = db["ppg_measurements"]

ist = pytz.timezone("Asia/Kolkata")


@router.post("/ppg")
def receive_ppg(data: dict):

    signal = data.get("signal", [])

    if len(signal) < 500:
        return {"error": "Signal too short"}

    if max(signal) - min(signal) < 100:
        return {"error": "Poor signal quality"}

    result = analyze_ppg(signal)

    document = {
        "timestamp": datetime.now(ist),
        "heart_rate": result.get("heart_rate", 0),
        "rmssd": result.get("rmssd", 0),
        "cardiac_score": result.get("cardiac_score", 0),
        "signal_length": len(signal),
        "signal": signal
    }

    collection.insert_one(document)

    document["_id"] = str(document["_id"])

    return document


@router.get("/history")
def get_history():

    data = []

    for item in collection.find({}, {"_id": 0}).sort("timestamp", 1):

        data.append({
            "timestamp": item["timestamp"],
            "heart_rate": item["heart_rate"],
            "rmssd": item["rmssd"],
            "cardiac_score": item["cardiac_score"],
            "signal_length": item["signal_length"]
        })

    return data


@router.post("/ppg")
def receive_ppg(data: dict):

    signal = data.get("signal", [])

    # 1️⃣ No signal received
    if not signal:
        return {"error": "No signal received"}

    # 2️⃣ Signal too short
    if len(signal) < 30:
        return {"error": "Signal too short"}

    # 3️⃣ Poor signal quality
    if max(signal) - min(signal) < 100:
        return {"error": "Poor signal quality"}

    try:

        result = analyze_ppg(signal)

    except Exception as e:
        return {"error": "Signal processing failed"}

    document = {
        "timestamp": datetime.now(ist),
        "heart_rate": result.get("heart_rate", 0),
        "rmssd": result.get("rmssd", 0),
        "cardiac_score": result.get("cardiac_score", 0),
        "signal_length": len(signal)
    }

    collection.insert_one(document)

    document["_id"] = str(document["_id"])

    return document


@router.get("/history")
def get_history():

    data = []

    for item in collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(20):

        data.append({
            "timestamp": item["timestamp"],
            "heart_rate": item["heart_rate"],
            "rmssd": item["rmssd"],
            "cardiac_score": item["cardiac_score"],
            "signal_length": item["signal_length"]
        })

    return data