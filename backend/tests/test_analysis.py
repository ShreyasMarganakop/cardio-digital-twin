import math
import os
import sys
import unittest


os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "cardio_test_db")
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.models.cardiac_model import cardiac_score
from app.services.ppg_analysis import analyze_ppg


class TestAnalysis(unittest.TestCase):
    def test_cardiac_score_rewards_better_than_baseline(self):
        strong_state = cardiac_score(62, 48, baseline_hr=70, baseline_rmssd=35)
        weak_state = cardiac_score(86, 20, baseline_hr=70, baseline_rmssd=35)

        self.assertGreater(strong_state, weak_state)
        self.assertGreaterEqual(strong_state, 0)
        self.assertLessEqual(strong_state, 100)

    def test_analyze_ppg_returns_metrics_for_clean_signal(self):
        fs = 100
        signal = [math.sin(2 * math.pi * 1.2 * i / fs) for i in range(500)]

        result = analyze_ppg(
            signal,
            fs=fs,
            baseline={"baseline_hr": 70.0, "baseline_rmssd": 30.0},
        )

        self.assertIn("heart_rate", result)
        self.assertIn("rmssd", result)
        self.assertIn("cardiac_score", result)
        self.assertEqual(result["signal_quality"], "good")
        self.assertIsNotNone(result["hr_delta_from_baseline"])
        self.assertIsNotNone(result["rmssd_delta_from_baseline"])

    def test_analyze_ppg_rejects_empty_signal(self):
        result = analyze_ppg([])
        self.assertEqual(result["error"], "No signal received")


if __name__ == "__main__":
    unittest.main()
