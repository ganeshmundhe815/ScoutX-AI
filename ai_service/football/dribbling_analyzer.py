import numpy as np
from football.foot_analyzer import FootAnalyzer
from utils.scoring import calculate_dribbling_score


class DribblingAnalyzer:
    """
    Measurable Football Dribbling & Agility Analysis Engine:
    - Measures exact drill duration in seconds
    - Tracks ball touches and foot contact distribution
    - Calculates player-ball stride proximity index
    - Measures directional cuts (vector angle > 38 degrees)
    - Returns separate Raw Metrics and Documented Performance Score
    """
    def __init__(self, fps=30, preferred_foot="Right"):
        self.fps = max(1, fps)
        self.foot_analyzer = FootAnalyzer(declared_preferred_foot=preferred_foot)
        self.frame_count = 0
        self.ball_detected_frames = 0
        self.ball_positions = []
        self.player_positions = []
        self.proximity_ratios = []
        self.direction_changes = 0
        self.ball_loss_events = 0

    def process_frame(self, landmarks, ball_data, frame_shape):
        self.frame_count += 1
        h, w = frame_shape[:2]

        foot_info = self.foot_analyzer.process_frame(landmarks, ball_data, frame_shape)

        if ball_data and ball_data.get('detected'):
            self.ball_detected_frames += 1
            bx, by = ball_data['center']
            self.ball_positions.append((bx, by))

            if landmarks and len(landmarks) >= 33:
                hip_l = landmarks[23]
                hip_r = landmarks[24]
                ankle_l = landmarks[27]

                if hip_l.get('is_reliable', True) and hip_r.get('is_reliable', True):
                    px = int((hip_l['x_pixel'] + hip_r['x_pixel']) / 2)
                    py = int((hip_l['y_pixel'] + hip_r['y_pixel']) / 2)
                    self.player_positions.append((px, py))

                    leg_len = max(40.0, float(np.linalg.norm(
                        np.array([hip_l['x_pixel'], hip_l['y_pixel']]) - np.array([ankle_l['x_pixel'], ankle_l['y_pixel']])
                    )))

                    dist = float(np.linalg.norm(np.array([px, py]) - np.array([bx, by])))
                    ratio = dist / leg_len
                    self.proximity_ratios.append(ratio)

                    # Ball loss event: ball strayed beyond 2.2x player leg length
                    if ratio > 2.2:
                        self.ball_loss_events += 1

            # Directional Cut Trigonometry
            if len(self.ball_positions) >= 6:
                v_curr = np.array(self.ball_positions[-1]) - np.array(self.ball_positions[-3])
                v_prev = np.array(self.ball_positions[-3]) - np.array(self.ball_positions[-6])

                mag_c = np.linalg.norm(v_curr)
                mag_p = np.linalg.norm(v_prev)

                if mag_c > 5.0 and mag_p > 5.0:
                    cos_t = np.clip(np.dot(v_curr, v_prev) / (mag_c * mag_p), -1.0, 1.0)
                    angle = np.degrees(np.arccos(cos_t))
                    if angle > 38.0:
                        self.direction_changes += 1
                        self.ball_positions = self.ball_positions[-2:]

        return self._format_realtime_data(foot_info)

    def _format_realtime_data(self, foot_info):
        dur = round(self.frame_count / float(self.fps), 1)
        avg_r = float(np.mean(self.proximity_ratios)) if self.proximity_ratios else 0.55
        consistency = max(50.0, min(98.0, 100.0 - (max(0, avg_r - 0.35) * 60.0)))

        return {
            'drill': 'dribbling',
            'duration_sec': dur,
            'ball_touches': foot_info['total_touches'],
            'left_touches': foot_info['left_touches'],
            'right_touches': foot_info['right_touches'],
            'active_foot': foot_info['active_foot'],
            'control_consistency': round(consistency, 1),
            'direction_changes': self.direction_changes,
            'ball_losses': self.ball_loss_events,
            'status': 'Measuring close control & slalom turns...',
        }

    def finalize_assessment(self):
        duration_sec = max(1.0, round(self.frame_count / float(self.fps), 1))
        touches = self.foot_analyzer.total_touches
        summary = self.foot_analyzer._get_summary()

        avg_ratio = float(np.mean(self.proximity_ratios)) if self.proximity_ratios else 0.55
        consistency = max(55.0, min(97.0, 100.0 - (max(0, avg_ratio - 0.35) * 60.0)))

        # Calculate documented score
        score = calculate_dribbling_score(
            duration_sec=duration_sec,
            ball_touches=touches,
            control_consistency=consistency,
            direction_changes=self.direction_changes
        )

        ball_vis_pct = (self.ball_detected_frames / float(max(1, self.frame_count))) * 100.0
        confidence = round(min(0.96, max(0.50, (ball_vis_pct / 100.0) * 0.90 + (0.06 if touches > 5 else 0.0))), 2)

        raw_metrics = {
            'durationSec': duration_sec,
            'ballTouches': touches,
            'leftFootTouches': self.foot_analyzer.left_touches,
            'rightFootTouches': self.foot_analyzer.right_touches,
            'directionChanges': self.direction_changes,
            'ballLossEvents': self.ball_loss_events,
            'avgProximityRatio': round(avg_ratio, 2),
            'controlConsistencyPercentage': round(consistency, 1),
        }

        feedback = []
        if consistency >= 85.0:
            feedback.append("Elite Close Control: Ball maintained within close stride radius throughout the drill.")
        else:
            feedback.append("Close Control Tip: Keep touches lighter when navigating through cones.")

        if self.direction_changes >= 4:
            feedback.append(f"Sharp Directional Agility: Completed {self.direction_changes} high-angle directional cuts.")

        if summary['left_percentage'] >= 25.0 and summary['right_percentage'] >= 25.0:
            feedback.append(f"Bilateral Foot Balance: {summary['left_percentage']}% Left / {summary['right_percentage']}% Right touch distribution.")
        else:
            feedback.append(f"Foot Bias Noted: Observed {summary['observedFootUsage']}.")

        return {
            'drillType': 'dribbling',
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
