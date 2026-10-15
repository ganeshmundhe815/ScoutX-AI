import numpy as np


class FootAnalyzer:
    """
    High-Precision Foot Contact & Bilateral Foot Balance Engine:
    - Body-scaled dynamic touch threshold (proportional to leg length)
    - Landmark visibility confidence filtering (rejects occluded ankles/toes)
    - Inflection detection to record exact physical strikes
    - Separates observedFootUsage from declaredPreferredFoot
    """
    def __init__(self, fps=30, declared_preferred_foot="Right"):
        self.fps = max(1.0, float(fps))
        self.declared_preferred_foot = declared_preferred_foot
        self.left_touches = 0
        self.right_touches = 0
        self.total_touches = 0
        self.prev_dist_left = 999.0
        self.prev_dist_right = 999.0
        self.cooldown_limit = max(1, int(round(self.fps * 0.15)))  # ~0.15s refractory period
        self.cooldown_frames = 0
        self.valid_frame_count = 0
        self.touch_events = []


    def process_frame(self, landmarks, ball_data, frame_shape):
        if self.cooldown_frames > 0:
            self.cooldown_frames -= 1

        if not landmarks or len(landmarks) < 33 or not ball_data or not ball_data.get('detected'):
            return self._get_summary(active_foot=None, is_touch=False, confidence=0.0)

        h, w = frame_shape[:2]
        bx, by = ball_data['center']

        # Extract Left Foot Landmarks (Ankle 27, Heel 29, Toe 31)
        l_ankle = landmarks[27]
        l_heel = landmarks[29]
        l_toe = landmarks[31]

        # Extract Right Foot Landmarks (Ankle 28, Heel 30, Toe 32)
        r_ankle = landmarks[28]
        r_heel = landmarks[30]
        r_toe = landmarks[32]

        # Check visibility reliability
        left_visible = (l_ankle.get('is_reliable', True) or l_toe.get('is_reliable', True))
        right_visible = (r_ankle.get('is_reliable', True) or r_toe.get('is_reliable', True))

        if not left_visible and not right_visible:
            return self._get_summary(active_foot=None, is_touch=False, confidence=0.3)

        self.valid_frame_count += 1

        # Calculate dynamic threshold based on leg length (Hip to Ankle in pixels)
        l_hip_pos = np.array([landmarks[23]['x_pixel'], landmarks[23]['y_pixel']])
        l_ankle_pos = np.array([l_ankle['x_pixel'], l_ankle['y_pixel']])
        leg_len = float(np.linalg.norm(l_hip_pos - l_ankle_pos))
        dynamic_threshold = max(30.0, min(75.0, leg_len * 0.42))

        ball_pos = np.array([bx, by])

        dist_left = 999.0
        if left_visible:
            dist_left = min(
                float(np.linalg.norm(ball_pos - l_ankle_pos)),
                float(np.linalg.norm(ball_pos - np.array([l_toe['x_pixel'], l_toe['y_pixel']]))),
                float(np.linalg.norm(ball_pos - np.array([l_heel['x_pixel'], l_heel['y_pixel']]))),
            )

        dist_right = 999.0
        if right_visible:
            r_ankle_pos = np.array([r_ankle['x_pixel'], r_ankle['y_pixel']])
            dist_right = min(
                float(np.linalg.norm(ball_pos - r_ankle_pos)),
                float(np.linalg.norm(ball_pos - np.array([r_toe['x_pixel'], r_toe['y_pixel']]))),
                float(np.linalg.norm(ball_pos - np.array([r_heel['x_pixel'], r_heel['y_pixel']]))),
            )

        active_foot = "Left" if dist_left < dist_right else "Right"
        min_dist = min(dist_left, dist_right)
        is_touch = False

        if min_dist < dynamic_threshold and self.cooldown_frames == 0:
            if (active_foot == "Left" and dist_left <= self.prev_dist_left + 3.5) or \
               (active_foot == "Right" and dist_right <= self.prev_dist_right + 3.5):
                is_touch = True
                self.total_touches += 1
                if active_foot == "Left":
                    self.left_touches += 1
                else:
                    self.right_touches += 1

                self.touch_events.append({
                    'foot': active_foot,
                    'dist': round(min_dist, 1),
                    'frame': self.valid_frame_count,
                })
                self.cooldown_frames = self.cooldown_limit

        self.prev_dist_left = dist_left
        self.prev_dist_right = dist_right

        confidence = round(min(0.95, 0.70 + (0.25 if (left_visible and right_visible) else 0.0)), 2)
        return self._get_summary(active_foot=active_foot, is_touch=is_touch, confidence=confidence)

    def _get_summary(self, active_foot=None, is_touch=False, confidence=0.85):
        total = max(1, self.total_touches)
        left_pct = round((self.left_touches / float(total)) * 100.0, 1) if self.total_touches > 0 else 0.0
        right_pct = round((self.right_touches / float(total)) * 100.0, 1) if self.total_touches > 0 else 0.0

        if self.total_touches == 0:
            observed_usage = "Not observed"
        elif right_pct > 65.0:
            observed_usage = "Right-Dominant"
        elif left_pct > 65.0:
            observed_usage = "Left-Dominant"
        else:
            observed_usage = "Bilateral / Two-Footed"


        return {
            'active_foot': active_foot,
            'is_touch': is_touch,
            'left_touches': self.left_touches,
            'right_touches': self.right_touches,
            'total_touches': self.total_touches,
            'left_percentage': left_pct,
            'right_percentage': right_pct,
            'observedFootUsage': observed_usage,
            'declaredPreferredFoot': self.declared_preferred_foot,
            'footConfidence': confidence,
        }
