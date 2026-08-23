import time


class VerticalJumpAnalyzer:
    """
    Vertical Jump Explosive Power Analyzer:
    1. Tracks ankle / toe ground contact line.
    2. Measures air flight time (delta_t in seconds).
    3. Calculates Jump Height in centimeters using projectile physics:
       Height (cm) = (1/8) * g * (flight_time)^2
       where g = 981 cm/s^2.
    """
    def __init__(self, fps=30):
        self.fps = fps
        self.state = "GROUND"  # "GROUND", "AIRBORNE", "LANDED"
        self.takeoff_frame = 0
        self.landing_frame = 0
        self.flight_time_sec = 0.0
        self.jump_height_cm = 0.0
        self.max_jump_height_cm = 0.0
        self.baseline_ankle_y = None
        self.total_jumps = 0
        self.feedback = "Stand in frame to calibrate baseline"

    def process_frame(self, landmarks, frame_idx):
        if not landmarks or len(landmarks) < 29:
            return {
                'state': self.state,
                'jump_height_cm': self.jump_height_cm,
                'max_jump_height_cm': self.max_jump_height_cm,
                'flight_time_ms': int(self.flight_time_sec * 1000),
                'total_jumps': self.total_jumps,
                'feedback': "Searching for athlete...",
            }

        # 27: Left Ankle, 28: Right Ankle, 23: Left Hip
        l_ankle_y = landmarks[27]['y_norm']
        r_ankle_y = landmarks[28]['y_norm']
        avg_ankle_y = (l_ankle_y + r_ankle_y) / 2.0

        # Calibrate ground baseline during initial standing
        if self.baseline_ankle_y is None:
            self.baseline_ankle_y = avg_ankle_y
            self.feedback = "Calibrated. Ready to jump!"
            return self._format_result()

        # Update baseline slightly if standing still
        if self.state == "GROUND" and abs(avg_ankle_y - self.baseline_ankle_y) < 0.02:
            self.baseline_ankle_y = 0.9 * self.baseline_ankle_y + 0.1 * avg_ankle_y

        # Take-off threshold (ankles rise above baseline by 4% frame height)
        is_in_air = avg_ankle_y < (self.baseline_ankle_y - 0.04)

        # 1. Takeoff Transition: GROUND -> AIRBORNE
        if is_in_air and self.state == "GROUND":
            self.state = "AIRBORNE"
            self.takeoff_frame = frame_idx
            self.feedback = "🚀 In the Air!"

        # 2. Landing Transition: AIRBORNE -> LANDED
        elif not is_in_air and self.state == "AIRBORNE":
            self.state = "GROUND"
            self.landing_frame = frame_idx
            self.total_jumps += 1

            # Calculate Flight Time (frames / fps)
            duration_frames = max(1, self.landing_frame - self.takeoff_frame)
            self.flight_time_sec = duration_frames / float(self.fps)

            # Physics Formula: h = (1/8) * g * t^2 (g = 981 cm/s^2)
            g = 981.0  # cm/s^2
            self.jump_height_cm = round((1.0 / 8.0) * g * (self.flight_time_sec ** 2), 1)

            if self.jump_height_cm > self.max_jump_height_cm:
                self.max_jump_height_cm = self.jump_height_cm

            self.feedback = f"Jumped {self.jump_height_cm} cm! ({int(self.flight_time_sec * 1000)} ms)"

        return self._format_result()

    def _format_result(self):
        return {
            'state': self.state,
            'jump_height_cm': self.jump_height_cm,
            'max_jump_height_cm': self.max_jump_height_cm,
            'flight_time_ms': int(self.flight_time_sec * 1000),
            'total_jumps': self.total_jumps,
            'feedback': self.feedback,
        }
