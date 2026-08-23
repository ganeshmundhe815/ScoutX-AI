from utils.geometry import calculate_angle


class PushUpAnalyzer:
    """
    Biomechanical Push-Up Analyzer:
    1. Measures Elbow angle (Shoulder -> Elbow -> Wrist).
    2. Measures Body Line / Plank angle (Shoulder -> Hip -> Ankle).
    3. Counts valid reps when elbow <= 90 degrees and body line remains straight.
    4. Detects faults: 'Incomplete descent' and 'Sagging or Piking Hips'.
    """
    def __init__(self):
        self.state = "UP"
        self.total_reps = 0
        self.valid_reps = 0
        self.invalid_reps = 0
        self.min_elbow_angle = 180.0
        self.faults = []
        self.feedback = "Get in plank position"

    def process_frame(self, landmarks):
        if not landmarks or len(landmarks) < 29:
            return {
                'reps': self.total_reps,
                'valid_reps': self.valid_reps,
                'elbow_angle': 0.0,
                'body_angle': 0.0,
                'state': self.state,
                'feedback': "Searching for full body...",
                'form_score': self._calculate_form_score(),
            }

        # Left side landmarks
        # 11: Shoulder, 13: Elbow, 15: Wrist, 23: Hip, 27: Ankle
        l_shoulder = (landmarks[11]['x_norm'], landmarks[11]['y_norm'])
        l_elbow = (landmarks[13]['x_norm'], landmarks[13]['y_norm'])
        l_wrist = (landmarks[15]['x_norm'], landmarks[15]['y_norm'])
        l_hip = (landmarks[23]['x_norm'], landmarks[23]['y_norm'])
        l_ankle = (landmarks[27]['x_norm'], landmarks[27]['y_norm'])

        # Calculate Joint Angles
        elbow_angle = calculate_angle(l_shoulder, l_elbow, l_wrist)
        body_line_angle = calculate_angle(l_shoulder, l_hip, l_ankle)

        # Track lowest descent
        if self.state == "DOWN":
            if elbow_angle < self.min_elbow_angle:
                self.min_elbow_angle = elbow_angle

        # State Transitions
        # 1. Lowering Chest
        if elbow_angle < 125.0 and self.state == "UP":
            self.state = "DOWN"
            self.min_elbow_angle = elbow_angle
            self.feedback = "Lowering chest..."

        if self.state == "DOWN":
            if elbow_angle <= 90.0:
                self.feedback = "Good Depth! Push up."
            else:
                self.feedback = "Lower Chest (< 90°)"

        # 2. Pushing Back UP
        if elbow_angle > 155.0 and self.state == "DOWN":
            self.state = "UP"
            self.total_reps += 1

            is_valid = True

            # Check elbow angle depth
            if self.min_elbow_angle > 95.0:
                is_valid = False
                self.faults.append(f"Rep {self.total_reps}: Incomplete chest depth ({int(self.min_elbow_angle)}°)")

            # Check body line alignment (Sagging hips if body angle < 145)
            if body_line_angle < 145.0:
                is_valid = False
                self.faults.append(f"Rep {self.total_reps}: Sagging hips (Keep core tight)")

            if is_valid:
                self.valid_reps += 1
                self.feedback = "Good Rep! +1"
            else:
                self.invalid_reps += 1
                self.feedback = "Improper Form (No Count)"

            self.min_elbow_angle = 180.0

        return {
            'reps': self.total_reps,
            'valid_reps': self.valid_reps,
            'invalid_reps': self.invalid_reps,
            'elbow_angle': elbow_angle,
            'body_angle': body_line_angle,
            'state': self.state,
            'feedback': self.feedback,
            'faults': self.faults,
            'form_score': self._calculate_form_score(),
        }

    def _calculate_form_score(self):
        if self.total_reps == 0:
            return 100.0
        score = (self.valid_reps / self.total_reps) * 100.0
        return round(score, 1)
