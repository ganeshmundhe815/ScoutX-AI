from utils.geometry import calculate_angle


class SquatAnalyzer:
    """
    Biomechanical Squat Analyzer:
    1. Measures Knee angle (Hip -> Knee -> Ankle).
    2. Measures Back/Torso inclination angle (Shoulder -> Hip -> Knee).
    3. Counts valid reps when knee angle <= 90 degrees.
    4. Detects faults: 'Insufficient Depth (>90 deg)' and 'Excessive Back Lean'.
    """
    def __init__(self):
        self.state = "UP"  # State Machine: "UP" or "DOWN"
        self.total_reps = 0
        self.valid_reps = 0
        self.invalid_reps = 0
        self.min_angle_in_rep = 180.0
        self.faults = []
        self.feedback = "Stand straight to begin"

    def process_frame(self, landmarks):
        """
        Processes a single frame's 33 landmarks.
        Returns: {
            'reps': int,
            'valid_reps': int,
            'knee_angle': float,
            'back_angle': float,
            'state': str,
            'feedback': str,
            'form_score': float
        }
        """
        if not landmarks or len(landmarks) < 29:
            return {
                'reps': self.total_reps,
                'valid_reps': self.valid_reps,
                'knee_angle': 0.0,
                'back_angle': 0.0,
                'state': self.state,
                'feedback': "Searching for full body...",
                'form_score': self._calculate_form_score(),
            }

        # Use left side landmarks (or right if more visible)
        # 11: Left Shoulder, 23: Left Hip, 25: Left Knee, 27: Left Ankle
        l_shoulder = (landmarks[11]['x_norm'], landmarks[11]['y_norm'])
        l_hip = (landmarks[23]['x_norm'], landmarks[23]['y_norm'])
        l_knee = (landmarks[25]['x_norm'], landmarks[25]['y_norm'])
        l_ankle = (landmarks[27]['x_norm'], landmarks[27]['y_norm'])

        # Calculate Joint Angles
        knee_angle = calculate_angle(l_hip, l_knee, l_ankle)
        back_angle = calculate_angle(l_shoulder, l_hip, l_knee)

        # Track the lowest depth reached during the repetition
        if self.state == "DOWN":
            if knee_angle < self.min_angle_in_rep:
                self.min_angle_in_rep = knee_angle

        # State Machine Transitions
        # 1. Going DOWN
        if knee_angle < 130.0 and self.state == "UP":
            self.state = "DOWN"
            self.min_angle_in_rep = knee_angle
            self.feedback = "Squatting down..."

        # Check Depth Quality while in DOWN state
        if self.state == "DOWN":
            if knee_angle <= 90.0:
                self.feedback = "Perfect Depth! Stand up."
            else:
                self.feedback = "Go Lower (< 90 deg)"

        # 2. Coming UP (Completing repetition)
        if knee_angle > 160.0 and self.state == "DOWN":
            self.state = "UP"
            self.total_reps += 1

            # Validate whether the rep reached proper depth
            if self.min_angle_in_rep <= 95.0:
                self.valid_reps += 1
                self.feedback = "Good Rep! +1"
            else:
                self.invalid_reps += 1
                fault_msg = f"Rep {self.total_reps}: Shallow depth ({int(self.min_angle_in_rep)}° instead of <=90°)"
                self.faults.append(fault_msg)
                self.feedback = "Incomplete depth (No Count)"

            # Check for excessive torso/back rounding (back angle < 65)
            if back_angle < 65.0:
                fault_msg = f"Rep {self.total_reps}: Torso leaned too far forward"
                if fault_msg not in self.faults:
                    self.faults.append(fault_msg)

            # Reset min angle for next rep
            self.min_angle_in_rep = 180.0

        return {
            'reps': self.total_reps,
            'valid_reps': self.valid_reps,
            'invalid_reps': self.invalid_reps,
            'knee_angle': knee_angle,
            'back_angle': back_angle,
            'state': self.state,
            'feedback': self.feedback,
            'faults': self.faults,
            'form_score': self._calculate_form_score(),
        }

    def _calculate_form_score(self):
        """Calculates Form Quality percentage (0 to 100%)."""
        if self.total_reps == 0:
            return 100.0
        score = (self.valid_reps / self.total_reps) * 100.0
        return round(score, 1)
