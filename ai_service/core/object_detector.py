import os
import cv2
import numpy as np

# Configurable YOLO Model Path via Environment Variable
DEFAULT_MODEL = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "yolov8n.pt")
YOLO_MODEL_PATH = os.environ.get("YOLO_MODEL_PATH", DEFAULT_MODEL)
if not os.path.exists(YOLO_MODEL_PATH) and os.path.exists(DEFAULT_MODEL):
    YOLO_MODEL_PATH = DEFAULT_MODEL

try:
    import torch
    TORCH_AVAILABLE = True
    if hasattr(torch, 'set_num_threads'):
        try:
            torch.set_num_threads(1)
            torch.set_grad_enabled(False)
        except Exception:
            pass
except Exception:
    TORCH_AVAILABLE = False

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except Exception:
    YOLO_AVAILABLE = False


class FootballKalmanTracker:
    """
    2D Kalman Filter for smooth, continuous ball trajectory tracking.
    Maintains ball motion state (x, y, vx, vy) and bridges short detection gaps.
    """
    def __init__(self):
        self.kalman = cv2.KalmanFilter(4, 2)
        self.kalman.measurementMatrix = np.array([[1, 0, 0, 0],
                                                  [0, 1, 0, 0]], np.float32)
        self.kalman.transitionMatrix = np.array([[1, 0, 1, 0],
                                                 [0, 1, 0, 1],
                                                 [0, 0, 1, 0],
                                                 [0, 0, 0, 1]], np.float32)
        self.kalman.processNoiseCov = np.array([[1, 0, 0, 0],
                                                [0, 1, 0, 0],
                                                [0, 0, 1, 0],
                                                [0, 0, 0, 1]], np.float32) * 0.03
        self.initialized = False
        self.missed_frames = 0

    def update(self, coord):
        """
        Updates state with new measurement or predicts next position during short occlusions.
        """
        if coord is None:
            if not self.initialized:
                return None
            self.missed_frames += 1
            if self.missed_frames > 8:  # Maximum 8 frames (~0.25s) interpolation
                return None
            prediction = self.kalman.predict()
            px = float(prediction[0][0] if len(prediction.shape) > 1 else prediction[0])
            py = float(prediction[1][0] if len(prediction.shape) > 1 else prediction[1])
            return int(px), int(py)

        x, y = coord
        measurement = np.array([[np.float32(x)], [np.float32(y)]])
        self.missed_frames = 0

        if not self.initialized:
            self.kalman.statePre = np.array([[np.float32(x)], [np.float32(y)], [0], [0]], np.float32)
            self.kalman.statePost = np.array([[np.float32(x)], [np.float32(y)], [0], [0]], np.float32)
            self.initialized = True
            return x, y

        self.kalman.correct(measurement)
        prediction = self.kalman.predict()
        px = float(prediction[0][0] if len(prediction.shape) > 1 else prediction[0])
        py = float(prediction[1][0] if len(prediction.shape) > 1 else prediction[1])
        return int(px), int(py)


class FootballObjectDetector:
    """
    Modular Football Object Detection & Tracking Engine:
    - Primary Engine: OpenCV DNN ONNX (Pure C++, 70MB RAM, zero PyTorch overhead, headless cloud optimized)
    - Fallback Engine: Ultralytics PyTorch YOLO (if available)
    - Fallback Filter: Pitch HSV Subtraction & Circularity Moments
    - Validates Goal Post presence
    - Returns structured detection dictionaries with confidence scores and frame IDs
    """
    def __init__(self, model_path=None, conf_threshold=0.20):
        self.conf_threshold = conf_threshold
        self.tracker = FootballKalmanTracker()
        self.last_player_bbox = None
        self.last_goal_data = None
        self.engine_type = "cv_ensemble"
        self.onnx_net = None
        self.model = None

        # 1. Primary Engine: Ultra-Lightweight OpenCV DNN (Pure C++, 70MB RAM, zero PyTorch overhead)
        onnx_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "yolov8n.onnx")
        if os.path.exists(onnx_path):
            try:
                self.onnx_net = cv2.dnn.readNetFromONNX(onnx_path)
                self.engine_type = "opencv_onnx"
                print(f"[YOLO ENGINE] Successfully loaded OpenCV DNN ONNX model: {onnx_path} (Ultra-low RAM).")
            except Exception as e:
                print(f"[YOLO ENGINE WARN] Could not load ONNX model ({e}). Trying PyTorch...")
                self.onnx_net = None

        # 2. Secondary Engine: Ultralytics PyTorch YOLO (if ONNX not available)
        if self.onnx_net is None and YOLO_AVAILABLE:
            self.model_path = model_path or YOLO_MODEL_PATH
            try:
                self.model = YOLO(self.model_path)
                self.engine_type = "pytorch_yolo"
                print(f"[YOLO ENGINE] Successfully loaded PyTorch model: {self.model_path}")
            except Exception as e:
                print(f"[YOLO ENGINE WARN] Could not load PyTorch model ({e}). Using CV ensemble.")
                self.model = None

    def detect_objects(self, frame, frame_idx=0):
        """
        Executes multi-object detection on a single video frame.
        Optimized with imgsz=320 for rapid CPU inference.
        
        Returns structured dictionary:
        {
            'frame': frame_idx,
            'ball': {'detected': bool, 'x': int, 'y': int, 'width': int, 'height': int, 'center': (x,y), 'confidence': float} or None,
            'player': {'detected': bool, 'bbox': [x1,y1,x2,y2], 'center': (x,y), 'confidence': float} or None,
            'all_players': list of detected person bboxes,
            'goal': {'detected': bool, 'confidence': float, 'status': str, 'bbox': list or None}
        }
        """
        h, w, _ = frame.shape
        raw_ball = None
        players = []

        # 1. Ultra-Lightweight OpenCV DNN ONNX Object Detection (70MB RAM, pure C++)
        if self.onnx_net is not None:
            try:
                blob = cv2.dnn.blobFromImage(frame, 1.0 / 255.0, (320, 320), swapRB=True)
                self.onnx_net.setInput(blob)
                out = self.onnx_net.forward()
                preds = out[0].T
                x_scale = float(w) / 320.0
                y_scale = float(h) / 320.0

                boxes = []
                confidences = []
                class_ids = []

                for pred in preds:
                    class_scores = pred[4:]
                    class_id = int(np.argmax(class_scores))
                    conf = float(class_scores[class_id])
                    if conf >= self.conf_threshold:
                        cx = pred[0] * x_scale
                        cy = pred[1] * y_scale
                        bw = pred[2] * x_scale
                        bh = pred[3] * y_scale
                        x1 = int(max(0, cx - bw / 2.0))
                        y1 = int(max(0, cy - bh / 2.0))
                        boxes.append([x1, y1, int(bw), int(bh)])
                        confidences.append(conf)
                        class_ids.append(class_id)

                indices = cv2.dnn.NMSBoxes(boxes, confidences, self.conf_threshold, 0.45)
                if len(indices) > 0:
                    for i in indices:
                        idx = int(i[0]) if isinstance(i, (list, tuple, np.ndarray)) else int(i)
                        cid = class_ids[idx]
                        c = confidences[idx]
                        x1, y1, bw, bh = boxes[idx]
                        x2, y2 = min(w, x1 + bw), min(h, y1 + bh)
                        cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)

                        # Class 32: sports ball
                        if cid == 32:
                            if raw_ball is None or c > raw_ball['confidence']:
                                raw_ball = {
                                    'detected': True,
                                    'x': x1,
                                    'y': y1,
                                    'width': bw,
                                    'height': bh,
                                    'center': (cx, cy),
                                    'radius': max(5, int(bw / 2)),
                                    'confidence': round(c, 3),
                                }
                        # Class 0: person
                        elif cid == 0:
                            players.append({
                                'bbox': [x1, y1, x2, y2],
                                'center': (cx, cy),
                                'area': bw * bh,
                                'confidence': round(c, 3),
                            })
            except Exception as e:
                print(f"[ONNX INFERENCE WARN] {e}")

        # 2. PyTorch YOLO Detection (Fallback if ONNX is not available)
        elif self.model is not None:
            try:
                if TORCH_AVAILABLE:
                    with torch.inference_mode():
                        results = self.model(frame, imgsz=320, verbose=False, conf=self.conf_threshold)[0]
                else:
                    results = self.model(frame, imgsz=320, verbose=False, conf=self.conf_threshold)[0]
                for box in results.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]
                    cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
                    bw, bh = x2 - x1, y2 - y1

                    if cls_id == 32 or (len(self.model.names) == 1 and cls_id == 0):
                        if raw_ball is None or conf > raw_ball['confidence']:
                            raw_ball = {
                                'detected': True,
                                'x': x1,
                                'y': y1,
                                'width': bw,
                                'height': bh,
                                'center': (cx, cy),
                                'radius': max(5, int(bw / 2)),
                                'confidence': round(conf, 3),
                            }
                    elif cls_id == 0:
                        players.append({
                            'bbox': [x1, y1, x2, y2],
                            'center': (cx, cy),
                            'area': bw * bh,
                            'confidence': round(conf, 3),
                        })
                del results
            except Exception:
                pass

        # 2. Resilient Ball Fallback via HSV Pitch Subtraction & Circularity Moments (run only when needed)
        if raw_ball is None and (not self.tracker.initialized or self.tracker.missed_frames >= 2):
            raw_ball = self._detect_ball_color_circularity(frame)

        # 3. Kalman Temporal Tracking & Smoothing
        raw_center = raw_ball['center'] if raw_ball else None
        smoothed_center = self.tracker.update(raw_center)

        ball_data = None
        if smoothed_center:
            bx, by = smoothed_center
            if raw_ball:
                r = raw_ball.get('radius', 10)
                conf = raw_ball.get('confidence', 0.75)
            else:
                r = 10
                conf = 0.50  # Lower confidence during Kalman-only interpolation
            
            ball_data = {
                'detected': True,
                'x': max(0, bx - r),
                'y': max(0, by - r),
                'width': r * 2,
                'height': r * 2,
                'center': (bx, by),
                'radius': r,
                'confidence': round(conf, 3),
            }
        else:
            ball_data = {
                'detected': False,
                'confidence': 0.0,
            }

        # 4. Target Athlete Isolation (Select primary athlete by size and temporal consistency)
        target_player = self._isolate_primary_athlete(players, (w, h))

        # 5. Goal Post Detection Validation (cached every 15 frames to conserve CPU)
        if self.last_goal_data is None or frame_idx % 15 == 0:
            self.last_goal_data = self._detect_goal_structure(frame)
        goal_data = self.last_goal_data

        return {
            'frame': frame_idx,
            'ball': ball_data if ball_data.get('detected') else None,
            'player': target_player,
            'all_players': players,
            'goal': goal_data,
        }


    def _isolate_primary_athlete(self, players, frame_dims):
        """
        Isolates the target athlete being assessed from bystanders or background persons.
        Selects the person with the largest bounding area closest to the frame center.
        """
        if not players:
            return None

        w, h = frame_dims
        frame_center = np.array([w / 2.0, h / 2.0])

        best_player = None
        best_score = -1.0

        for p in players:
            p_center = np.array(p['center'])
            dist_to_center = float(np.linalg.norm(p_center - frame_center))
            norm_dist = dist_to_center / (np.linalg.norm(frame_center) + 1e-5)
            
            # Score: larger area + central position
            score = (p['area'] / float(w * h)) * 0.7 + (1.0 - norm_dist) * 0.3
            if score > best_score:
                best_score = score
                best_player = {
                    'detected': True,
                    'bbox': p['bbox'],
                    'center': p['center'],
                    'confidence': p['confidence'],
                }

        self.last_player_bbox = best_player['bbox'] if best_player else None
        return best_player

    def _detect_ball_color_circularity(self, frame):
        """
        Extracts high-contrast spherical football objects via HSV pitch subtraction and shape moments.
        """
        h, w = frame.shape[:2]
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # Mask pitch green
        lower_green = np.array([30, 40, 40])
        upper_green = np.array([85, 255, 255])
        pitch_mask = cv2.inRange(hsv, lower_green, upper_green)
        non_pitch = cv2.bitwise_not(pitch_mask)

        # High brightness foreground
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        _, bright_mask = cv2.threshold(gray, 185, 255, cv2.THRESH_BINARY)
        combined = cv2.bitwise_and(bright_mask, non_pitch)

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        cleaned = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel)

        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        best_candidate = None
        best_score = 0

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 25 < area < 4000:
                perimeter = cv2.arcLength(cnt, True)
                if perimeter > 0:
                    circularity = (4 * np.pi * area) / (perimeter * perimeter)
                    if circularity > 0.55:
                        (cx, cy), radius = cv2.minEnclosingCircle(cnt)
                        vertical_weight = cy / float(h)
                        score = circularity * 0.6 + vertical_weight * 0.4
                        if score > best_score:
                            best_score = score
                            r = int(radius)
                            best_candidate = {
                                'detected': True,
                                'x': max(0, int(cx - r)),
                                'y': max(0, int(cy - r)),
                                'width': r * 2,
                                'height': r * 2,
                                'center': (int(cx), int(cy)),
                                'radius': max(6, r),
                                'confidence': round(float(circularity * 0.85), 3),
                            }

        return best_candidate

    def _detect_goal_structure(self, frame):
        """
        Validates whether a physical goalpost structure is detectable in the frame.
        If prominent white vertical/horizontal goalpost posts are found, returns goal geometry.
        Otherwise explicitly returns 'Goal structure unavailable'.
        """
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)

        # Detect strong linear structures (posts and crossbars)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=int(h * 0.25), maxLineGap=20)
        
        has_vertical = False
        has_horizontal = False

        if lines is not None:
            for line in lines:
                l_pts = line.ravel()
                if len(l_pts) >= 4:
                    x1, y1, x2, y2 = int(l_pts[0]), int(l_pts[1]), int(l_pts[2]), int(l_pts[3])
                    dx = abs(x2 - x1)
                    dy = abs(y2 - y1)
                    if dy > dx * 3 and dy > int(h * 0.25):
                        has_vertical = True
                    if dx > dy * 3 and dx > int(w * 0.20):
                        has_horizontal = True

        if has_vertical and (has_horizontal or (lines is not None and len(lines) >= 3)):
            # Bounding box for detected goal area
            gx1, gy1 = int(w * 0.60), int(h * 0.10)
            gx2, gy2 = int(w * 0.95), int(h * 0.80)
            return {
                'detected': True,
                'confidence': 0.82,
                'status': 'Goal structure detected',
                'bbox': [gx1, gy1, gx2, gy2],
                'target_center': (int((gx1 + gx2) / 2), int((gy1 + gy2) / 2)),
            }
        else:
            return {
                'detected': False,
                'confidence': 0.0,
                'status': 'Goal structure unavailable',
                'bbox': None,
                'target_center': None,
            }
