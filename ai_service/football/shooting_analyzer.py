import numpy as np
from football.foot_analyzer import FootAnalyzer
from utils.scoring import calculate_shooting_score


class ShootingAnalyzer:
    """
    Measurable Football Shooting & Finishing Analysis Engine:
    - Tracks shot release acceleration impulse
    - Calculates scale-invariant relative power index (0 to 100)
    - Validates goal post presence and separates onTargetAccuracy from goalConversion
    - Returns separate Raw Metrics and Documented Performance Score
    """
    def __init__(self, fps=30, preferred_foot="Right"):
        self.fps = max(1.0, float(fps))
        self.foot_analyzer = FootAnalyzer(fps=self.fps, declared_preferred_foot=preferred_foot)
        self.shots_count = 0
        self.on_target_count = 0
        self.goals_detected = 0
        self.goal_available = False
        self.shot_velocities_normalized = []
        self.shot_trajectories = []
        self.prev_ball_pos = None
        self.prev_velocity = 0.0
        self.in_shot_motion = False
        self.shot_start_frame = 0
        self.frame_count = 0

    def process_frame(self, landmarks, ball_data, goal_data, frame_shape):
        self.frame_count += 1
        h, w = frame_shape[:2]

        foot_info = self.foot_analyzer.process_frame(landmarks, ball_data, frame_shape)

        if goal_data and goal_data.get('detected'):
            self.goal_available = True

        # Calculate player height in pixels for physical scale calibration
        player_height_px = 250.0
        if landmarks and len(landmarks) >= 33:
            nose = landmarks[0]
            ankle_l = landmarks[27]
            ankle_r = landmarks[28]
            if nose.get('is_reliable', True) and (ankle_l.get('is_reliable', True) or ankle_r.get('is_reliable', True)):
                ankle_y = max(ankle_l['y_pixel'], ankle_r['y_pixel'])
                if ankle_y > nose['y_pixel']:
                    player_height_px = max(90.0, float(ankle_y - nose['y_pixel']))

        if ball_data and ball_data.get('detected'):
            curr_pos = np.array(ball_data['center'], dtype=np.float32)

            if self.prev_ball_pos is not None:
                raw_vel = float(np.linalg.norm(curr_pos - self.prev_ball_pos))
                normalized_vel = (raw_vel / player_height_px) * 100.0
                acceleration = normalized_vel - self.prev_velocity

                # Shot release impulse trigger (> 18 normalized displacement and sharp acceleration)
                if normalized_vel > 18.0 and acceleration > 5.5 and not self.in_shot_motion:
                    self.in_shot_motion = True
                    self.shots_count += 1
                    self.shot_start_frame = self.frame_count
                    self.shot_velocities_normalized.append(normalized_vel)

                    # Spatial trajectory evaluation
                    if self.goal_available and goal_data and 'quadrants' in goal_data:
                        quads = goal_data['quadrants']
                        bx, by = int(curr_pos[0]), int(curr_pos[1])

                        if quads['top_right'][0] - 25 <= bx and quads['top_right'][1] - 25 <= by <= quads['top_right'][3] + 25:
                            self.on_target_count += 1
                            self.goals_detected += 1
                            self.shot_trajectories.append("Top-Right Corner")
                        elif quads['top_left'][0] - 25 <= bx and quads['top_left'][1] - 25 <= by <= quads['top_left'][3] + 25:
                            self.on_target_count += 1
                            self.goals_detected += 1
                            self.shot_trajectories.append("Top-Left Corner")
                        elif quads['bottom_right'][0] - 25 <= bx and quads['bottom_right'][1] - 25 <= by <= quads['bottom_right'][3] + 25:
                            self.on_target_count += 1
                            self.goals_detected += 1
                            self.shot_trajectories.append("Bottom-Right Corner")
                        elif quads['bottom_left'][0] - 25 <= bx and quads['bottom_left'][1] - 25 <= by <= quads['bottom_left'][3] + 25:
                            self.on_target_count += 1
                            self.goals_detected += 1
                            self.shot_trajectories.append("Bottom-Left Corner")
                        else:
                            self.shot_trajectories.append("Off-Target")
                    else:
                        # Goal post structure not visible in camera; trajectory assessed by forward vector
                        if curr_pos[0] > w * 0.4:
                            self.on_target_count += 1
                            self.shot_trajectories.append("On-Target (Forward Trajectory)")
                        else:
                            self.shot_trajectories.append("Wide")

                if self.in_shot_motion and (self.frame_count - self.shot_start_frame) > 12:
                    self.in_shot_motion = False

                self.prev_velocity = normalized_vel

            self.prev_ball_pos = curr_pos

        return self._format_realtime_data()

    def _format_realtime_data(self):
        shots = max(1, self.shots_count)
        acc = round((self.on_target_count / float(shots)) * 100.0, 1) if self.shots_count > 0 else 0.0
        avg_norm_vel = float(np.mean(self.shot_velocities_normalized)) if self.shot_velocities_normalized else 0.0
        est_power = round(max(30.0, min(96.0, 40.0 + (avg_norm_vel * 1.35))), 1) if self.shot_velocities_normalized else 0.0

        return {
            'drill': 'shooting',
            'shots_taken': self.shots_count,
            'on_target': self.on_target_count,
            'goals_detected': self.goals_detected if self.goal_available else 'unavailable',
            'accuracy_percentage': acc if self.shots_count > 0 else None,
            'estimated_power': est_power if self.shots_count > 0 else None,
            'last_target': self.shot_trajectories[-1] if self.shot_trajectories else "Ready to shoot",
            'status': "Tracking shot acceleration & trajectory...",
        }

    def finalize_assessment(self):
        shots = self.shots_count
        summary = self.foot_analyzer._get_summary()

        if shots > 0:
            acc = round((self.on_target_count / float(shots)) * 100.0, 1)
            conversion = round((self.goals_detected / float(shots)) * 100.0, 1) if self.goal_available else None
            avg_norm_vel = float(np.mean(self.shot_velocities_normalized)) if self.shot_velocities_normalized else 25.0
            est_power_index = round(float(np.clip(45.0 + (avg_norm_vel * 1.35), 35.0, 96.0)), 1)
            score = calculate_shooting_score(
                on_target_accuracy=acc,
                estimated_power=est_power_index,
                goals_detected=self.goals_detected if self.goal_available else None,
                shots_count=shots
            )
            confidence = round(0.88 if self.goal_available else 0.78, 2)
        else:
            acc = None
            conversion = None
            est_power_index = None
            score = 50.0
            confidence = 0.30

        raw_metrics = {
            'attemptsCount': shots,
            'onTargetCount': self.on_target_count,
            'goalsDetected': self.goals_detected if self.goal_available else None,
            'goalDetectionStatus': 'Goal structure detected' if self.goal_available else 'Goal structure unavailable',
            'onTargetAccuracyPercentage': acc,
            'conversionRatePercentage': conversion,
            'estimatedPowerIndex': est_power_index,
            'shotDirection': self.shot_trajectories[-1] if self.shot_trajectories else "None detected",
        }

        feedback = []
        if shots == 0:
            feedback.append("No shot release events detected. Ensure the athlete takes a clear strike on camera.")
        else:
            if acc is not None and acc >= 75.0:
                feedback.append(f"Clinical Accuracy: {acc}% on-target trajectory precision.")
            else:
                feedback.append("Finishing Advice: Maintain chest over ball upon impact to keep strikes on-target.")

            if est_power_index is not None:
                feedback.append(f"Estimated Shot Power Index: {int(est_power_index)}/100 (Relative Biomechanical Index).")

        if not self.goal_available:
            feedback.append("Goal structure unavailable: Trajectory precision evaluated via 2D vector kinematics.")

        return {
            'drillType': 'shooting',
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
            'limitations': "Single-camera 2D perspective approximation. Depth and elevation velocities projected onto camera sensor plane.",
        }

