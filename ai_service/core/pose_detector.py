import os
import sys
import urllib.request
import cv2
import numpy as np
import mediapipe as mp

# Try importing MediaPipe Tasks (may fail on headless Linux without libGLESv2)
try:
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    TASKS_AVAILABLE = True
except Exception:
    TASKS_AVAILABLE = False

# 33 Standard MediaPipe Skeletal Landmark Connections
POSE_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8), (9, 10),
    (11, 12), (11, 13), (13, 15), (12, 14), (14, 16), (11, 23), (12, 24),
    (23, 24), (23, 25), (24, 26), (25, 27), (26, 28), (27, 29), (28, 30),
    (29, 31), (30, 32), (27, 31), (28, 32)
]

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "pose_landmarker_lite.task")


class StandardizedPoseResult:
    """Wrapper that normalizes pose landmark results across Solutions and Tasks APIs."""
    def __init__(self, landmarks):
        self.pose_landmarks = [landmarks] if landmarks and len(landmarks) > 0 else []


class PoseDetector:
    """
    Robust Dual-Engine PoseDetector for Football Biomechanical Analysis:
    1. Primary Engine: MediaPipe Solutions Pose (Pure CPU BlazePose Lite, zero libGLESv2 / OpenGL dependencies)
    2. Secondary Engine: MediaPipe Tasks PoseLandmarker (with graceful exception handling)
    3. Guarantees non-crashing execution on headless Linux cloud containers (Render, AWS, Heroku)
    """
    def __init__(self, min_pose_detection_confidence=0.50, min_pose_presence_confidence=0.50, min_visibility_thresh=0.50):
        self.min_visibility_thresh = min_visibility_thresh
        self.detector_type = None
        self.detector = None

        # 1. Primary: MediaPipe Solutions Pose (Proven CPU native engine)
        try:
            if hasattr(mp, "solutions") and hasattr(mp.solutions, "pose"):
                self.mp_pose = mp.solutions.pose
                self.detector = self.mp_pose.Pose(
                    static_image_mode=False,
                    model_complexity=0,  # 0 = Lite, ideal for cloud CPU
                    min_detection_confidence=min_pose_detection_confidence,
                    min_tracking_confidence=min_pose_presence_confidence,
                )
                self.detector_type = "solutions"
                print("⚡ [POSE ENGINE] MediaPipe Solutions Pose initialized (Pure CPU, headless compliant).")
        except Exception as e:
            print(f"[POSE ENGINE WARN] Solutions Pose init notice: {e}")

        # 2. Secondary fallback: MediaPipe Tasks PoseLandmarker
        if self.detector is None and TASKS_AVAILABLE:
            try:
                self._ensure_model_exists()
                base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
                options = vision.PoseLandmarkerOptions(
                    base_options=base_options,
                    running_mode=vision.RunningMode.IMAGE,
                    num_poses=1,
                    min_pose_detection_confidence=min_pose_detection_confidence,
                    min_pose_presence_confidence=min_pose_presence_confidence,
                )
                self.detector = vision.PoseLandmarker.create_from_options(options)
                self.detector_type = "tasks"
                print("⚡ [POSE ENGINE] MediaPipe Tasks PoseLandmarker initialized.")
            except Exception as e:
                print(f"[POSE ENGINE WARN] Tasks PoseLandmarker init notice: {e}")

    def _ensure_model_exists(self):
        """Downloads the lightweight MediaPipe model file if not already present."""
        if not os.path.exists(MODEL_PATH):
            os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
            print(f"[INFO] Downloading MediaPipe Pose model to: {MODEL_PATH} ...")
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            print("[SUCCESS] Model downloaded successfully!")

    def find_pose(self, frame, draw=True):
        """
        Processes a BGR OpenCV frame, runs pose estimation, and draws skeletal overlays.
        Returns: (result, annotated_frame)
        """
        annotated_frame = frame.copy()
        landmarks = []

        if self.detector is not None:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            if self.detector_type == "solutions":
                try:
                    res = self.detector.process(rgb_frame)
                    if res and res.pose_landmarks:
                        landmarks = res.pose_landmarks.landmark
                except Exception as e:
                    print(f"[POSE WARN] Frame processing notice: {e}")
            elif self.detector_type == "tasks":
                try:
                    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                    res = self.detector.detect(mp_image)
                    if res and res.pose_landmarks and len(res.pose_landmarks) > 0:
                        landmarks = res.pose_landmarks[0]
                except Exception as e:
                    print(f"[POSE WARN] Tasks frame processing notice: {e}")

        if draw and landmarks and len(landmarks) > 0:
            h, w, _ = frame.shape

            # 1. Draw Skeletal Connection Lines
            for connection in POSE_CONNECTIONS:
                idx1, idx2 = connection
                if idx1 < len(landmarks) and idx2 < len(landmarks):
                    lm1 = landmarks[idx1]
                    lm2 = landmarks[idx2]
                    v1 = getattr(lm1, 'visibility', 1.0) or 1.0
                    v2 = getattr(lm2, 'visibility', 1.0) or 1.0
                    if float(v1) >= self.min_visibility_thresh and float(v2) >= self.min_visibility_thresh:
                        pt1 = (int(lm1.x * w), int(lm1.y * h))
                        pt2 = (int(lm2.x * w), int(lm2.y * h))
                        cv2.line(annotated_frame, pt1, pt2, (255, 200, 0), 2)

            # 2. Draw Key Joint Landmark Circles
            for idx, lm in enumerate(landmarks):
                v = getattr(lm, 'visibility', 1.0) or 1.0
                if float(v) >= self.min_visibility_thresh:
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    # Highlight key athletic joints (Shoulders, Hips, Knees, Ankles)
                    if idx in [11, 12, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]:
                        cv2.circle(annotated_frame, (cx, cy), 5, (0, 165, 255), cv2.FILLED)
                        cv2.circle(annotated_frame, (cx, cy), 7, (255, 255, 255), 1)
                    else:
                        cv2.circle(annotated_frame, (cx, cy), 3, (0, 255, 128), cv2.FILLED)

        result = StandardizedPoseResult(landmarks)
        return result, annotated_frame

    def get_landmarks(self, frame, result):
        """
        Extracts landmark coordinates and visibility values into a clean dictionary list.
        """
        landmark_list = []
        if result and hasattr(result, 'pose_landmarks') and result.pose_landmarks and len(result.pose_landmarks) > 0:
            landmarks = result.pose_landmarks[0]
            h, w, _ = frame.shape
            for idx, lm in enumerate(landmarks):
                v = getattr(lm, 'visibility', 1.0)
                v = float(v) if v is not None else 1.0
                p = getattr(lm, 'presence', 1.0)
                p = float(p) if p is not None else 1.0
                landmark_list.append({
                    "id": idx,
                    "x_pixel": int(lm.x * w),
                    "y_pixel": int(lm.y * h),
                    "x_norm": float(lm.x),
                    "y_norm": float(lm.y),
                    "z": float(getattr(lm, 'z', 0.0) or 0.0),
                    "visibility": v,
                    "presence": p,
                    "is_reliable": v >= self.min_visibility_thresh,
                })
        return landmark_list
