import numpy as np
from football.foot_analyzer import FootAnalyzer
from utils.scoring import calculate_ball_control_score


class BallControlAnalyzer:
    """
    Measurable Football Ball Control & Juggling Analysis Engine:
    - Measures consecutive controlled contacts and foot contact cushioning
    - Tracks first-touch displacement and momentum absorption
    - Analyzes bilateral two-footed juggling equilibrium
    - Returns separate Raw Metrics and Documented Performance Score
    """
    def __init__(self, fps=30, preferred_foot="Right"):
        self.fps = max(1.0, float(fps))
        self.foot_analyzer = FootAnalyzer(fps=self.fps, declared_preferred_foot=preferred_foot)
        self.cushion_distances = []
        self.frame_count = 0
        self.ball_detected_frames = 0
        self.first_touch_recorded = False
        self.first_touch_displacement = None

    def process_frame(self, landmarks, ball_data, frame_shape):
        self.frame_count += 1
        foot_info = self.foot_analyzer.process_frame(landmarks, ball_data, frame_shape)

        if ball_data and ball_data.get('detected'):
            self.ball_detected_frames += 1

            if foot_info['is_touch'] and landmarks and len(landmarks) >= 33:
                ankle_idx = 27 if foot_info['active_foot'] == "Left" else 28
                ankle_lm = landmarks[ankle_idx]

                if ankle_lm.get('is_reliable', True):
                    fx = ankle_lm['x_pixel']
                    fy = ankle_lm['y_pixel']
                    bx, by = ball_data['center']
                    dist = float(np.linalg.norm(np.array([fx, fy]) - np.array([bx, by])))
                    self.cushion_distances.append(dist)

                    if not self.first_touch_recorded:
                        self.first_touch_displacement = round(dist, 1)
                        self.first_touch_recorded = True

        return self._format_realtime_data(foot_info)

    def _format_realtime_data(self, foot_info):
        touches = foot_info['total_touches']
        if self.cushion_distances:
            avg_dist = float(np.mean(self.cushion_distances))
            rebound_control = round(max(55.0, min(98.0, 100.0 - (avg_dist * 0.42))), 1)
        else:
            rebound_control = None

        return {
            'drill': 'ball_control',
            'touches_count': touches,
            'left_touches': foot_info['left_touches'],
            'right_touches': foot_info['right_touches'],
            'left_percentage': foot_info['left_percentage'],
            'right_percentage': foot_info['right_percentage'],
            'rebound_control': rebound_control,
            'first_touch_px': self.first_touch_displacement,
            'status': "Measuring impact cushioning & juggling balance...",
        }

    def finalize_assessment(self):
        duration_sec = max(1.0, round(self.frame_count / float(self.fps), 1))
        touches = self.foot_analyzer.total_touches
        summary = self.foot_analyzer._get_summary()

        if touches > 0:
            avg_dist = float(np.mean(self.cushion_distances)) if self.cushion_distances else 25.0
            rebound_control = round(float(np.clip(100.0 - (avg_dist * 0.42), 55.0, 97.0)), 1)
            consistency = round(float(np.clip(60.0 + (touches * 1.5), 55.0, 98.0)), 1)
            first_touch = self.first_touch_displacement or round(avg_dist, 1)

            score = calculate_ball_control_score(
                touches_count=touches,
                control_consistency=consistency,
                rebound_control_score=rebound_control,
                duration_sec=duration_sec
            )
            ball_vis_pct = (self.ball_detected_frames / float(max(1, self.frame_count))) * 100.0
            confidence = round(min(0.95, max(0.50, (ball_vis_pct / 100.0) * 0.90 + (0.05 if touches > 8 else 0.0))), 2)
        else:
            rebound_control = None
            consistency = None
            first_touch = None
            score = 50.0
            confidence = 0.25

        raw_metrics = {
            'touchesCount': touches,
            'durationSec': duration_sec,
            'leftFootTouches': self.foot_analyzer.left_touches,
            'rightFootTouches': self.foot_analyzer.right_touches,
            'firstTouchDisplacementPx': first_touch,
            'reboundControlPercentage': rebound_control,
            'controlConsistencyPercentage': consistency,
        }

        feedback = []
        if touches == 0:
            feedback.append("No controlled ball contacts were detected in this video. Ensure ball and athlete's feet are visible.")
        else:
            if rebound_control and rebound_control >= 85.0:
                feedback.append("Soft First Touch Cushion: Exceptional momentum absorption upon foot arrival.")
            else:
                feedback.append("Cushioning Tip: Relax ankle upon contact to absorb excess rebound bounce.")

            if summary['left_percentage'] >= 25.0 and summary['right_percentage'] >= 25.0:
                feedback.append(f"Two-Footed Equilibrium: {summary['left_percentage']}% Left / {summary['right_percentage']}% Right touch balance.")
            else:
                feedback.append(f"Observed Usage: {summary['observedFootUsage']}.")

        return {
            'drillType': 'ball_control',
            'rawMetrics': raw_metrics,
            'score': score,
            'confidence': confidence,
            'footUsage': {
                'leftPercentage': summary['left_percentage'],
                'rightPercentage': summary['right_percentage'],
                'observedFootUsage': summary['observedFootUsage'],
                'declaredPreferredFoot': summary['declaredPreferredFoot'],
            },
            'feedback': feedback,
        }

