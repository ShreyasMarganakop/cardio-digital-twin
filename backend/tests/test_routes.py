import os
import sys
import unittest
import types
from unittest.mock import patch


os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "cardio_test_db")
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

try:
    import fastapi  # noqa: F401
except ModuleNotFoundError:
    fastapi_stub = types.ModuleType("fastapi")

    class APIRouter:
        def __init__(self, prefix=""):
            self.prefix = prefix

        def post(self, *_args, **_kwargs):
            def decorator(func):
                return func
            return decorator

        def get(self, *_args, **_kwargs):
            def decorator(func):
                return func
            return decorator

    fastapi_stub.APIRouter = APIRouter
    sys.modules["fastapi"] = fastapi_stub

try:
    import pymongo  # noqa: F401
except ModuleNotFoundError:
    pymongo_stub = types.ModuleType("pymongo")

    class StubCollection(dict):
        def create_index(self, *_args, **_kwargs):
            return None

    class FakeDB(dict):
        def __getitem__(self, name):
            if name not in self:
                self[name] = StubCollection()
            return dict.__getitem__(self, name)

    class MongoClient:
        def __init__(self, *_args, **_kwargs):
            pass

        def __getitem__(self, _name):
            return FakeDB()

    pymongo_stub.MongoClient = MongoClient
    sys.modules["pymongo"] = pymongo_stub

try:
    import dotenv  # noqa: F401
except ModuleNotFoundError:
    dotenv_stub = types.ModuleType("dotenv")

    def load_dotenv():
        return None

    dotenv_stub.load_dotenv = load_dotenv
    sys.modules["dotenv"] = dotenv_stub

from app.routes import metrics
from app.schemas.ppg_schema import SimulationInput


class FakeInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class FakeCursor:
    def __init__(self, items):
        self._items = list(items)

    def sort(self, key, direction):
        reverse = direction == -1
        self._items.sort(key=lambda item: item.get(key), reverse=reverse)
        return self

    def limit(self, n):
        self._items = self._items[:n]
        return self

    def __iter__(self):
        return iter(self._items)


class FakeCollection:
    def __init__(self, items=None):
        self.items = list(items or [])

    def insert_one(self, document):
        stored = dict(document)
        stored["_id"] = str(len(self.items) + 1)
        self.items.append(stored)
        document["_id"] = stored["_id"]
        return FakeInsertResult(stored["_id"])

    def find(self, query=None, projection=None):
        query = query or {}
        results = []
        for item in self.items:
            if self._matches(item, query):
                if projection:
                    projected = {}
                    include_all = projection.get("_id") != 0
                    if include_all:
                        projected.update(item)
                    for key, value in projection.items():
                        if value and key in item:
                            projected[key] = item[key]
                    if projection.get("_id") == 0:
                        projected.pop("_id", None)
                    if not projected:
                        projected = {k: v for k, v in item.items() if k != "_id"}
                    results.append(projected)
                else:
                    results.append(dict(item))
        return FakeCursor(results)

    def find_one(self, query=None, sort=None):
        query = query or {}
        results = [item for item in self.items if self._matches(item, query)]
        if not results:
            return None
        if sort:
            key, direction = sort[0]
            results.sort(key=lambda item: item.get(key), reverse=direction == -1)
        return dict(results[0])

    @staticmethod
    def _matches(item, query):
        for key, value in query.items():
            if isinstance(value, dict) and "$gte" in value:
                if item.get(key) < value["$gte"]:
                    return False
            elif item.get(key) != value:
                return False
        return True


class TestRoutes(unittest.TestCase):
    def test_receive_ppg_stores_context_fields(self):
        fake_collection = FakeCollection()

        with patch.object(metrics, "collection", fake_collection), \
             patch.object(metrics, "analyze_ppg", return_value={
                 "heart_rate": 72.0,
                 "rmssd": 32.0,
                 "cardiac_score": 55.0,
                 "baseline_hr": 70.0,
                 "baseline_rmssd": 30.0,
                 "hr_delta_from_baseline": 2.0,
                 "rmssd_delta_from_baseline": 2.0,
             }), \
             patch.object(metrics, "build_user_baseline", return_value={"baseline_hr": 70.0, "baseline_rmssd": 30.0}):
            result = metrics.receive_ppg(metrics.PPGSignal(
                signal=[1.0] * 60 + [2.0] * 60,
                sampling_rate=100,
                user_id="shreyas",
                session_type="resting",
                activity_load=10,
                stress_level=20,
            ))

        self.assertEqual(result["user_id"], "shreyas")
        self.assertEqual(result["session_type"], "resting")
        self.assertEqual(result["activity_load"], 10)
        self.assertEqual(fake_collection.items[0]["stress_level"], 20)

    def test_recommendation_route_returns_generated_result(self):
        fake_collection = FakeCollection([
            {
                "_id": "1",
                "timestamp": metrics.datetime.now(metrics.ist),
                "user_id": "default-user",
                "session_type": "resting",
                "heart_rate": 80.0,
                "rmssd": 25.0,
                "cardiac_score": 45.0,
                "activity_load": 40,
                "stress_level": 55,
            }
        ])

        expected = {"recommended_action": "breathing", "recommendation": "Use caution"}

        with patch.object(metrics, "collection", fake_collection), \
             patch.object(metrics, "fetch_recent_measurements", return_value=[]), \
             patch.object(metrics, "build_user_baseline", return_value={"baseline_hr": 75.0, "baseline_rmssd": 30.0, "baseline_score": 50.0}), \
             patch.object(metrics, "generate_recommendation", return_value=expected):
            result = metrics.get_recommendation(user_id="default-user", session_type="resting")

        self.assertEqual(result, expected)

    def test_simulate_route_returns_no_data_when_user_not_found(self):
        fake_collection = FakeCollection()

        with patch.object(metrics, "collection", fake_collection):
            result = metrics.simulate_training(
                SimulationInput(strategy="exercise", user_id="missing-user", session_type="resting")
            )

        self.assertEqual(result["error"], "no data")


if __name__ == "__main__":
    unittest.main()
