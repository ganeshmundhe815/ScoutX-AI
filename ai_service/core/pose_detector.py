import os
import sys
import urllib.request
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# 33 Standard MediaPipe Skeletal Landmark Connections
POSE_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8), (9, 10),
    (11, 12), (11, 13), (13, 15), (12, 14), (14, 16), (11, 23), (12, 24),
    (23, 24), (23, 25), (24, 26), (25, 27), (26, 28), (27, 29), (28, 30),
    (29, 31), (30, 32), (27, 31), (28, 32)
]

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "pose_landmarker_lite.task")


class PoseDetector:
    """
    PoseDetector wraps MediaPipe PoseLandmarker to detect 33 3D body landmarks
    and draw sports skeletal overlays on video frames.
    """
    def __init__(self, min_pose_detection_confidence=0.5, min_pose_presence_confidence=0.5):
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

    def _ensure_model_exists(self):
        """Downloads the lightweight MediaPipe model file if not already present."""
        if not os.path.exists(MODEL_PATH):
            os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
            print(f"[INFO] Downloading MediaPipe Pose model to: {MODEL_PATH} ...")
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            print("[SUCCESS] Model downloaded successfully!")

    def find_pose(self, frame, draw=True):
        """
        Processes a BGR OpenCV frame, runs pose estimation, and draws skeletal lines.
        Returns: (result, annotated_frame)
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        result = self.detector.detect(mp_image)
        annotated_frame = frame.copy()

        if draw and result.pose_landmarks and len(result.pose_landmarks) > 0:
            landmarks = result.pose_landmarks[0]
            h, w, _ = frame.shape

            # 1. Draw Skeletal Connection Lines
            for connection in POSE_CONNECTIONS:
                idx1, idx2 = connection
                if idx1 < len(landmarks) and idx2 < len(landmarks):
                    lm1 = landmarks[idx1]
                    lm2 = landmarks[idx2]
                    
                    pt1 = (int(lm1.x * w), int(lm1.y * h))
                    pt2 = (int(lm2.x * w), int(lm2.y * h))
                    
                    cv2.line(annotated_frame, pt1, pt2, (255, 200, 0), 2)

            # 2. Draw Key Joint Landmark Circles
            for idx, lm in enumerate(landmarks):
                cx, cy = int(lm.x * w), int(lm.y * h)
                
                # Highlight key athletic joints (Shoulders, Hips, Knees, Ankles)
                if idx in [11, 12, 23, 24, 25, 26, 27, 28]:
                    cv2.circle(annotated_frame, (cx, cy), 6, (0, 165, 255), cv2.FILLED)
                    cv2.circle(annotated_frame, (cx, cy), 8, (255, 255, 255), 2)
                else:
                    cv2.circle(annotated_frame, (cx, cy), 4, (0, 255, 128), cv2.FILLED)

        return result, annotated_frame

    def get_landmarks(self, frame, result):
        """
        Extracts landmark coordinates into a clean dictionary list.
        """
        landmark_list = []
        if result.pose_landmarks and len(result.pose_landmarks) > 0:
            h, w, _ = frame.shape
            for idx, lm in enumerate(result.pose_landmarks[0]):
                landmark_list.append({
                    "id": idx,
                    "x_pixel": int(lm.x * w),
                    "y_pixel": int(lm.y * h),
                    "x_norm": lm.x,
                    "y_norm": lm.y,
                    "z": lm.z,
                    "visibility": lm.visibility,
                })
        return landmark_list
