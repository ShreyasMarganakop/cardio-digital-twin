from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

client = MongoClient(MONGO_URL)

db = client[DB_NAME]

heart_collection = db["heart_metrics"]
ppg_collection = db["ppg_measurements"]

# Keep user/session history queries fast as measurement volume grows.
ppg_collection.create_index([("user_id", 1), ("session_type", 1), ("timestamp", -1)])
ppg_collection.create_index([("timestamp", -1)])
