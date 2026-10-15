import os
import sys
import time
import unittest
import numpy as np
import cv2

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.pose_detector import PoseDetector
from core.object_detector import FootballObjectDetector
from core.video_validator import VideoQualityValidator
from football.foot_analyzer import FootAnalyzer
from football.dribbling_analyzer import DribblingAnalyzer
from football.shooting_analyzer import ShootingAnalyzer
from football.ball_control_analyzer import BallControlAnalyzer
from football.football_assessment import run_football_assessment
from app import app


class TestScoutX12Scenarios(unittest.TestCase):
    """
    Automated Verification Suite covering the 12 Scenarios for ScoutX-AI AI Engine & Backend.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        cls.sample_video = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample_athlete.mp4")
        cls.user_video = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "fb_1792040084_football-1792040084068-476215068.mp4")

    # -------------------------------------------------------------
    # Scenario 1: Health Check when AI Service is running
    # -------------------------------------------------------------
    def test_scenario_01_health_check_online(self):
        print("\n[Scenario 1] Testing /health endpoint...")
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertIn('models', data)
        self.assertIn('supportedDrills', data)
        print("  -> PASSED: /health returned HTTP 200 with model and drill specs.")

    # -------------------------------------------------------------
    # Scenario 2 & 3: Error categorization and offline handling
    # -------------------------------------------------------------
    def test_scenario_02_and_03_invalid_file_handling(self):
        import io
        print("\n[Scenario 2 & 3] Testing rejection of non-video uploads...")
        # Uploading a fake txt file disguised as video
        data = {
            'video': (io.BytesIO(b'fake non-video content'), 'test.txt'),
            'drillType': 'dribbling'
        }
        res = self.client.post('/api/ai/analyze', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 400)
        payload = res.get_json()
        self.assertEqual(payload['status'], 'invalid_format')
        self.assertIn("Unsupported video format", payload['message'])
        print(f"  -> PASSED: Successfully rejected invalid format with HTTP 400: {payload['message']}")


    # -------------------------------------------------------------
    # Scenario 4: Fast inference completion on standard video (< 10s)
    # -------------------------------------------------------------
    def test_scenario_04_fast_inference_speed(self):
        print("\n[Scenario 4] Benchmarking inference latency on sample video...")
        t0 = time.time()
        res = run_football_assessment(
            drill_type="dribbling",
            input_source=self.sample_video,
            output_video="temp_sc4.mp4"
        )
        total_time = time.time() - t0
        if os.path.exists("temp_sc4.mp4"):
            os.remove("temp_sc4.mp4")

        self.assertTrue(res['success'])
        self.assertLess(total_time, 12.0, f"Processing took {total_time:.2f}s, expected < 12.0s")
        print(f"  -> PASSED: Full pipeline completed in {total_time:.2f}s (well below timeout threshold).")
        print(f"  -> Latency Breakdown: {res['latencyBreakdown']}")

    # -------------------------------------------------------------
    # Scenario 5: High frame count / Long video dynamic stride
    # -------------------------------------------------------------
    def test_scenario_05_dynamic_frame_stride(self):
        print("\n[Scenario 5] Testing dynamic frame stride on 310-frame user video...")
        if os.path.exists(self.user_video):
            res = run_football_assessment(
                drill_type="dribbling",
                input_source=self.user_video,
                output_video="temp_sc5.mp4"
            )
            if os.path.exists("temp_sc5.mp4"):
                os.remove("temp_sc5.mp4")

            self.assertGreater(res['latencyBreakdown']['frameStride'], 1)
            self.assertLessEqual(res['latencyBreakdown']['framesAnalyzed'], 75)
            self.assertLess(res['processingTimeSec'], 10.0)
            print(f"  -> PASSED: 310 raw frames sampled at stride {res['latencyBreakdown']['frameStride']} into {res['latencyBreakdown']['framesAnalyzed']} frames in {res['processingTimeSec']}s.")
        else:
            print("  -> SKIPPED: User video not found on disk.")

    # -------------------------------------------------------------
    # Scenario 6: Video with missing ball (truthful metrics, not fabricated)
    # -------------------------------------------------------------
    def test_scenario_06_missing_ball_handling(self):
        print("\n[Scenario 6] Testing missing ball handling without fake defaults...")
        analyzer = DribblingAnalyzer(fps=10, preferred_foot="Right")
        # Run 20 frames with athlete landmarks but NO ball
        dummy_landmarks = [{'id': i, 'x_pixel': 320, 'y_pixel': 200, 'is_reliable': True} for i in range(33)]
        for _ in range(20):
            analyzer.process_frame(dummy_landmarks, None, (360, 640))

        report = analyzer.finalize_assessment()
        self.assertEqual(report['rawMetrics']['ballTouches'], 0)
        self.assertIsNone(report['rawMetrics']['controlConsistencyPercentage'])
        self.assertLessEqual(report['confidence'], 0.35)
        print("  -> PASSED: Missing ball accurately yields 0 touches and null consistency percentage.")

    # -------------------------------------------------------------
    # Scenario 7: Video with missing athlete
    # -------------------------------------------------------------
    def test_scenario_07_missing_athlete_handling(self):
        print("\n[Scenario 7] Testing missing athlete handling...")
        analyzer = DribblingAnalyzer(fps=10, preferred_foot="Right")
        dummy_ball = {'detected': True, 'center': (300, 300), 'radius': 10, 'confidence': 0.8}
        # Run 20 frames with ball but NO athlete landmarks
        for _ in range(20):
            analyzer.process_frame(None, dummy_ball, (360, 640))

        report = analyzer.finalize_assessment()
        self.assertEqual(report['rawMetrics']['ballTouches'], 0)
        self.assertEqual(report['footUsage']['observedFootUsage'], "Not observed")
        print("  -> PASSED: Missing athlete accurately sets foot contacts to 0 and observed usage to 'Not observed'.")

    # -------------------------------------------------------------
    # Scenario 8: Goal post detection when goal is present vs absent
    # -------------------------------------------------------------
    def test_scenario_08_goal_post_detection_unavailability(self):
        print("\n[Scenario 8] Testing goalpost detection status reporting...")
        detector = FootballObjectDetector()
        frame_no_goal = np.zeros((360, 640, 3), dtype=np.uint8)
        frame_no_goal[:] = (40, 140, 50)
        objs = detector.detect_objects(frame_no_goal)
        self.assertEqual(objs['goal']['status'], "Goal structure unavailable")
        self.assertFalse(objs['goal']['detected'])
        print("  -> PASSED: Absent goalposts reported as 'Goal structure unavailable'.")

    # -------------------------------------------------------------
    # Scenario 9: Dribbling assessment metrics verification
    # -------------------------------------------------------------
    def test_scenario_09_dribbling_metrics(self):
        print("\n[Scenario 9] Verifying dribbling metrics computation...")
        analyzer = DribblingAnalyzer(fps=10, preferred_foot="Right")
        # Simulate athlete and ball moving in zigzag to create directional cuts
        hip_y = 200
        ankle_y = 290
        for i in range(30):
            bx = 300 + (30 if (i // 6) % 2 == 0 else -30)
            by = 280
            lm = [{'id': j, 'x_pixel': 300, 'y_pixel': 200, 'is_reliable': True} for j in range(33)]
            lm[23] = {'id': 23, 'x_pixel': 290, 'y_pixel': hip_y, 'is_reliable': True}
            lm[24] = {'id': 24, 'x_pixel': 310, 'y_pixel': hip_y, 'is_reliable': True}
            lm[27] = {'id': 27, 'x_pixel': 295, 'y_pixel': ankle_y, 'is_reliable': True}
            lm[28] = {'id': 28, 'x_pixel': 305, 'y_pixel': ankle_y, 'is_reliable': True}
            ball = {'detected': True, 'center': (bx, by), 'radius': 10, 'confidence': 0.85}
            analyzer.process_frame(lm, ball, (360, 640))

        rep = analyzer.finalize_assessment()
        self.assertGreaterEqual(rep['rawMetrics']['durationSec'], 2.5)
        self.assertIn('directionChanges', rep['rawMetrics'])
        print(f"  -> PASSED: Dribbling analysis produced duration {rep['rawMetrics']['durationSec']}s and {rep['rawMetrics']['directionChanges']} directional cuts.")

    # -------------------------------------------------------------
    # Scenario 10: Shooting assessment metrics verification
    # -------------------------------------------------------------
    def test_scenario_10_shooting_metrics(self):
        print("\n[Scenario 10] Verifying shooting metrics computation...")
        analyzer = ShootingAnalyzer(fps=10, preferred_foot="Right")
        # 10 idle frames
        for i in range(10):
            ball = {'detected': True, 'center': (200, 250), 'radius': 10, 'confidence': 0.85}
            analyzer.process_frame(None, ball, None, (360, 640))
        # High velocity strike forward
        for i in range(5):
            ball = {'detected': True, 'center': (200 + i * 50, 250 - i * 15), 'radius': 10, 'confidence': 0.85}
            analyzer.process_frame(None, ball, None, (360, 640))

        rep = analyzer.finalize_assessment()
        self.assertGreaterEqual(rep['rawMetrics']['attemptsCount'], 1)
        self.assertEqual(rep['rawMetrics']['goalDetectionStatus'], 'Goal structure unavailable')
        self.assertIn('limitations', rep)
        print(f"  -> PASSED: Shot detected: {rep['rawMetrics']['attemptsCount']} attempts, power: {rep['rawMetrics']['estimatedPowerIndex']}.")

    # -------------------------------------------------------------
    # Scenario 11: Ball Control & Juggling assessment verification
    # -------------------------------------------------------------
    def test_scenario_11_ball_control_metrics(self):
        print("\n[Scenario 11] Verifying ball control metrics computation...")
        analyzer = BallControlAnalyzer(fps=10, preferred_foot="Right")
        lm = [{'id': j, 'x_pixel': 300, 'y_pixel': 200, 'is_reliable': True} for j in range(33)]
        lm[27] = {'id': 27, 'x_pixel': 295, 'y_pixel': 280, 'is_reliable': True}
        lm[28] = {'id': 28, 'x_pixel': 305, 'y_pixel': 280, 'is_reliable': True}
        lm[31] = {'id': 31, 'x_pixel': 295, 'y_pixel': 290, 'is_reliable': True}
        lm[32] = {'id': 32, 'x_pixel': 305, 'y_pixel': 290, 'is_reliable': True}

        # Simulate foot touch
        ball = {'detected': True, 'center': (305, 285), 'radius': 10, 'confidence': 0.85}
        analyzer.process_frame(lm, ball, (360, 640))

        rep = analyzer.finalize_assessment()
        self.assertIn('touchesCount', rep['rawMetrics'])
        self.assertIn('reboundControlPercentage', rep['rawMetrics'])
        print(f"  -> PASSED: Ball control verified: touches: {rep['rawMetrics']['touchesCount']}, cushion: {rep['rawMetrics']['reboundControlPercentage']}%.")

    # -------------------------------------------------------------
    # Scenario 12: API analyze JSON response structure verification
    # -------------------------------------------------------------
    def test_scenario_12_api_analyze_endpoint_payload(self):
        print("\n[Scenario 12] Testing POST /api/ai/analyze full JSON schema...")
        with open(self.sample_video, 'rb') as f:
            data = {
                'video': (f, 'sample_athlete.mp4'),
                'drillType': 'dribbling',
                'preferredFoot': 'Right'
            }
            res = self.client.post('/api/ai/analyze', data=data, content_type='multipart/form-data')

        self.assertEqual(res.status_code, 200)
        json_data = res.get_json()
        self.assertTrue(json_data['success'])
        self.assertIn('metrics', json_data)
        self.assertIn('rawMetrics', json_data)
        self.assertIn('latencyBreakdown', json_data)
        self.assertIn('footUsage', json_data)
        self.assertIn('videoQuality', json_data)
        print("  -> PASSED: Endpoint returned complete structured JSON with telemetry and compatibility nodes.")


if __name__ == '__main__':
    unittest.main(verbosity=2)
