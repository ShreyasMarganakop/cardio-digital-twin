import os
import sys
import unittest


os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "cardio_test_db")
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.recommendation import generate_recommendation
from app.services.simulation import simulate_strategy


class TestTrainingLogic(unittest.TestCase):
    def setUp(self):
        self.latest = {
            "heart_rate": 88,
            "rmssd": 18,
            "cardiac_score": 34,
            "activity_load": 70,
            "stress_level": 65,
            "hr_delta_from_baseline": 14,
            "rmssd_delta_from_baseline": -15,
        }
        self.recent = [
            {"heart_rate": 72, "rmssd": 33, "cardiac_score": 48},
            {"heart_rate": 70, "rmssd": 35, "cardiac_score": 50},
            {"heart_rate": 74, "rmssd": 31, "cardiac_score": 46},
        ]
        self.baseline = {"baseline_hr": 72, "baseline_rmssd": 33, "baseline_score": 48}

    def test_simulate_strategy_flags_risky_interval(self):
        result = simulate_strategy(
            latest_measurement=self.latest,
            recent_measurements=self.recent,
            strategy="interval",
            activity_load=70,
            stress_level=65,
            baseline=self.baseline,
        )

        self.assertEqual(result["strategy"], "interval")
        self.assertIn(result["recommendation"], {"Use caution", "Recovery first"})
        self.assertGreaterEqual(len(result["safety_alerts"]), 1)

    def test_generate_recommendation_returns_best_action_and_alternatives(self):
        result = generate_recommendation(
            latest_measurement=self.latest,
            recent_measurements=self.recent,
            baseline=self.baseline,
        )

        self.assertIn("recommended_action", result)
        self.assertIn("safety_status", result)
        self.assertIn("summary_reason", result)
        self.assertEqual(len(result["alternatives"]), 4)
        self.assertNotEqual(result["recommended_action"], "interval")


if __name__ == "__main__":
    unittest.main()
