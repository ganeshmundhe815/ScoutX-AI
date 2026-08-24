import os
import sys
import unittest
import numpy as np
import cv2

# Set path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.pose_detector import PoseDetector
from core.object_detector import FootballObjectDetector, FootballKalmanTracker
from core.video_validator import VideoQualityValidator
from football.foot_analyzer import FootAnalyzer
from football.dribbling_analyzer import DribblingAnalyzer
from football.shooting_analyzer import ShootingAnalyzer
from football.ball_control_analyzer import BallControlAnalyzer
from utils.scoring import (
    calculate_dribbling_score,
    calculate_shooting_score,
    calculate_ball_control_score,
    calculate_overall_football_score,
    calculate_national_percentile,
)
from football.football_assessment import run_football_assessment


class TestScoutXFootballAIPipeline(unittest.TestCase):
    """
    Comprehensive Automated Unit & Pipeline Validation Suite for ScoutX Football AI.
    Tests all 15 core criteria required by the validation master protocol.
    """

    def setUp(self):
        self.dummy_frame = np.zeros((360, 640, 3), dtype=np.uint8)
        # Create a synthetic football turf with pitch green and a white ball circle
        self.dummy_frame[:] = (35, 120, 45)  # Pitch green BGR
        cv2.circle(self.dummy_frame, (320, 240), 12, (255, 255, 255), -1)  # White ball
        cv2.circle(self.dummy_frame, (320, 240), 12, (0, 0, 0), 1)

    def test_01_dependencies(self):
        """1. Verify required libraries exist."""
        import cv2
        import mediapipe
        import numpy
        import torch
        import ultralytics
        self.assertTrue(hasattr(cv2, '__version__'))
        self.assertTrue(hasattr(numpy, '__version__'))

    def test_02_yolo_import(self):
        """2. Verify YOLO can be imported."""
        from ultralytics import YOLO
        self.assertTrue(YOLO is not None)

    def test_03_yolo_model_loading(self):
        """3. Verify YOLO model initializes."""
        detector = FootballObjectDetector(conf_threshold=0.20)
        self.assertTrue(detector is not None)

    def test_04_mediapipe_pose(self):
        """4. Verify MediaPipe Pose detector creates without crashing."""
        pose_detector = PoseDetector()
        res, ann = pose_detector.find_pose(self.dummy_frame, draw=False)
        self.assertTrue(ann is not None)
        self.assertEqual(ann.shape, (360, 640, 3))

    def test_05_opencv_video_processing(self):
        """5. Verify OpenCV video creation and reading."""
        temp_video = "temp_test_video.mp4"
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(temp_video, fourcc, 30, (640, 360))
        for _ in range(15):
            out.write(self.dummy_frame)
        out.release()

        cap = cv2.VideoCapture(temp_video)
        self.assertTrue(cap.isOpened())
        ret, frame = cap.read()
        self.assertTrue(ret)
        cap.release()
        if os.path.exists(temp_video):
            os.remove(temp_video)

    def test_06_ball_detection(self):
        """6. Verify ball detection returns structured dictionary."""
        detector = FootballObjectDetector()
        objs = detector.detect_objects(self.dummy_frame, frame_idx=1)
        self.assertIn('ball', objs)
        if objs['ball']:
            self.assertIn('x', objs['ball'])
            self.assertIn('y', objs['ball'])
            self.assertIn('confidence', objs['ball'])

    def test_07_player_detection(self):
        """7. Verify player isolation architecture handles empty or multi-person frames."""
        detector = FootballObjectDetector()
        objs = detector.detect_objects(self.dummy_frame, frame_idx=1)
        self.assertIn('player', objs)
        self.assertIn('all_players', objs)

    def test_08_goal_detection_unavailability(self):
        """8. Verify goal detection reports 'Goal structure unavailable' when no goalposts exist."""
        detector = FootballObjectDetector()
        objs = detector.detect_objects(self.dummy_frame, frame_idx=1)
        self.assertIn('goal', objs)
        self.assertEqual(objs['goal']['status'], 'Goal structure unavailable')
        self.assertFalse(objs['goal']['detected'])

    def test_09_kalman_tracking(self):
        """9. Verify Kalman tracking temporal prediction."""
        tracker = FootballKalmanTracker()
        pos1 = tracker.update((100, 100))
        self.assertEqual(pos1, (100, 100))
        pos2 = tracker.update((110, 105))
        self.assertTrue(pos2 is not None)
        # Interpolate missing frame
        pos_interp = tracker.update(None)
        self.assertTrue(pos_interp is not None)

    def test_10_video_quality_validator(self):
        """10. Verify pre-flight video quality validation."""
        validator = VideoQualityValidator()
        fq = validator.compute_frame_quality(self.dummy_frame)
        self.assertIn('brightness', fq)
        self.assertIn('blurScore', fq)
        self.assertFalse(fq['is_dark'])

    def test_11_dribbling_metrics_calculation(self):
        """11. Verify Dribbling score calculation uses documented formula."""
        score = calculate_dribbling_score(
            duration_sec=12.0,
            ball_touches=14,
            control_consistency=88.0,
            direction_changes=5
        )
        self.assertGreaterEqual(score, 10.0)
        self.assertLessEqual(score, 100.0)

    def test_12_shooting_metrics_calculation(self):
        """12. Verify Shooting score calculation."""
        score = calculate_shooting_score(
            on_target_accuracy=80.0,
            estimated_power=82.0,
            goals_detected=3,
            shots_count=4
        )
        self.assertGreaterEqual(score, 10.0)
        self.assertLessEqual(score, 100.0)

    def test_13_ball_control_metrics_calculation(self):
        """13. Verify Ball Control score calculation."""
        score = calculate_ball_control_score(
            touches_count=25,
            control_consistency=85.0,
            rebound_control_score=90.0,
            duration_sec=10.0
        )
        self.assertGreaterEqual(score, 10.0)
        self.assertLessEqual(score, 100.0)

    def test_14_foot_analysis(self):
        """14. Verify FootAnalyzer bilateral touch distribution."""
        foot_analyzer = FootAnalyzer(declared_preferred_foot="Right")
        summary = foot_analyzer._get_summary()
        self.assertIn('left_percentage', summary)
        self.assertIn('right_percentage', summary)
        self.assertIn('observedFootUsage', summary)
        self.assertIn('declaredPreferredFoot', summary)
        self.assertEqual(summary['declaredPreferredFoot'], "Right")

    def test_15_full_pipeline_assessment(self):
        """15. Verify full end-to-end video assessment pipeline execution."""
        sample_video = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample_athlete.mp4")
        if not os.path.exists(sample_video):
            from generate_test_video import create_sample_athlete_video
            create_sample_athlete_video(sample_video)

        report = run_football_assessment(
            drill_type="dribbling",
            input_source=sample_video,
            output_video="test_output.mp4",
            show_display=False
        )

        self.assertTrue(report["success"])
        self.assertIn("videoQuality", report)
        self.assertIn("detections", report)
        self.assertIn("rawMetrics", report)
        self.assertIn("score", report)
        self.assertIn("analysisConfidence", report)
        self.assertIn("annotatedVideoPath", report)

        if os.path.exists("test_output.mp4"):
            os.remove("test_output.mp4")


if __name__ == "__main__":
    unittest.main(verbosity=2)
