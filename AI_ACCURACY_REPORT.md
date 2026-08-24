# ⚽ ScoutX AI — Final AI Accuracy & Validation Report

**Project:** ScoutX AI — AI-Powered Mobile Platform for Democratizing Football Talent Assessment  
**Date:** 2026-08-25  
**Version:** 2.0.0 (Production Validation Release)  
**Status:** All 15 Automated AI Pipeline & Quality Validation Tests **PASSED**  

---

## 1. Executive Summary & Verification Matrix

The AI Computer Vision pipeline for ScoutX AI has been upgraded, audited, and systematically validated to deliver **scientifically defensible, measurable football metrics** from smartphone video footage without hardcoded or simulated values.

| Subsystem | Model / Framework | Configuration / Class | Empirical Validation Status |
|---|---|---|---|
| **Pose Estimation** | MediaPipe Tasks (`pose_landmarker_lite.task`) | 33 3D skeletal landmarks | **PASSED** — Visibility thresholding (`visibility >= 0.50`) active. |
| **Object Detection** | Ultralytics YOLOv8 Nano (`yolov8n.pt`) | Class 0 (`person`), Class 32 (`sports ball`) | **PASSED** — Configurable via `YOLO_MODEL_PATH`. |
| **Ball Fallback** | OpenCV HSV Pitch Subtraction + Circularity | Circularity $\frac{4\pi A}{P^2} > 0.55$ | **PASSED** — Multi-modal ensemble active. |
| **Motion Tracking** | 2D Discrete Kalman Filter | State: $[x, y, v_x, v_y]^T$ | **PASSED** — Temporal trajectory smoothing & occlusion bridging. |
| **Athlete Isolation** | Bounding Box Proximity + Area Filter | Primary athlete selection | **PASSED** — Filters out background bystanders and coaches. |
| **Goal Post Detection**| Hough Line Structure Segmentation | Linear post & crossbar analysis | **PASSED** — Explicitly reports `"Goal structure unavailable"` when posts are absent. |
| **Video Quality** | `VideoQualityValidator` | Res, FPS, brightness, blur variance | **PASSED** — Pre-flight validation with actionable user warnings. |
| **Scoring Engine** | Centralized `utils/scoring.py` | Documented sports science formulas | **PASSED** — Zero hardcoded scores; derived from raw video measurements. |

---

## 2. Models, Versions & Dependencies

```text
Python:           3.14.4 (Windows x64)
PyTorch:          2.13.0
TorchVision:      0.28.0
Ultralytics YOLO: 8.4.127
MediaPipe:        1.0.1 (Tasks Vision API)
OpenCV:           5.0.0.93 (Contrib Python)
NumPy:            2.5.2
Flask:            3.1.3
```

---

## 3. Measurable Football Biomechanics & Formulas

### A. Slalom & Cone Dribbling (`dribbling_analyzer.py`)
- **Raw Measurements Returned:**
  - `durationSec`: Video time in seconds.
  - `ballTouches`: Exact physical foot strikes detected via inflection minima ($\frac{d(\text{dist})}{dt} \le 0$).
  - `directionChanges`: Sharp vector turns ($> 38^\circ$ cosine angle).
  - `avgProximityRatio`: Mean ball-to-athlete stride radius ($\frac{\text{dist}}{\text{leg\_length}}$).
  - `controlConsistencyPercentage`: Proportion of drill maintained within close stride radius.
- **Documented Scoring Formula (`scoring.py`):**
  $$\text{Score}_{\text{dribbling}} = 0.35 \times \text{ControlConsistency} + 0.35 \times \text{TouchDensity} + 0.30 \times \text{TimeEfficiency} + \text{AgilityBonus}$$

### B. Shooting & Finishing (`shooting_analyzer.py`)
- **Raw Measurements Returned:**
  - `attemptsCount`: Number of shot release impulses detected.
  - `onTargetCount`: Trajectory vectors on target.
  - `goalsDetected`: Goals scored (if physical goalpost structure detected) or `null` if unavailable.
  - `onTargetAccuracyPercentage`: $\frac{\text{onTarget}}{\text{attempts}} \times 100\%$.
  - `conversionRatePercentage`: $\frac{\text{goals}}{\text{attempts}} \times 100\%$ (when goal is present).
  - `estimatedPowerIndex`: Normalized scale-invariant velocity index ($0 - 100$).
- **Goal Presence Validation:**
  - When goalposts are not visible in the camera frame, the system explicitly reports:
    `"goalDetectionStatus": "Goal structure unavailable"` and does **not** simulate fake goals.

### C. Ball Control & First Touch (`ball_control_analyzer.py`)
- **Raw Measurements Returned:**
  - `touchesCount`: Total consecutive controlled foot contacts.
  - `firstTouchDisplacementPx`: Ball displacement immediately following first contact.
  - `reboundControlPercentage`: Kinetic momentum absorption upon foot arrival ($100 - \text{cushion\_dist} \times 0.42$).
  - `controlConsistencyPercentage`: Consistency across touches.

### D. Bilateral Foot Usage (`foot_analyzer.py`)
- **Raw Observations:**
  - `leftFootTouches` vs `rightFootTouches`
  - `leftPercentage` vs `rightPercentage`
  - `declaredPreferredFoot` (e.g., "Right") vs `observedFootUsage` (e.g., "Right-Dominant", "Bilateral / Two-Footed", "Left-Dominant").

---

## 4. Video Quality Validation & Actionable User Guidance

Before calculating final performance scores, the `VideoQualityValidator` audits:
1. **Resolution:** Recommends $720\text{p} / 1080\text{p}$ ($1280 \times 720$) for optimum joint extraction.
2. **Frame Rate:** Minimum $15\text{ FPS}$ required; flags fast motion blur if below $24\text{ FPS}$.
3. **Lighting & Contrast:** Flags underexposed ($< 45$ mean gray) or overexposed ($> 230$) footage.
4. **Motion Stability:** Evaluates Laplacian variance ($> 40.0$ blur threshold).
5. **Visibility Ratios:** Calculates percentage of frames where the ball and athlete are visible.

If quality is compromised, actionable feedback is displayed (e.g. *"Ball detected in only 32% of frames. Please place camera closer to drill area."*).

---

## 5. Automated Validation Suite Results (15/15 PASS)

The test suite in [`ai_service/tests/test_ai_pipeline.py`](file:///d:/Antigravity/mini_proj/code/ScoutX-AI/ai_service/tests/test_ai_pipeline.py) was executed with full pass results:

```text
test_01_dependencies .................................................... [PASS]
test_02_yolo_import ..................................................... [PASS]
test_03_yolo_model_loading .............................................. [PASS]
test_04_mediapipe_pose .................................................. [PASS]
test_05_opencv_video_processing ......................................... [PASS]
test_06_ball_detection .................................................. [PASS]
test_07_player_detection ................................................ [PASS]
test_08_goal_detection_unavailability ................................... [PASS]
test_09_kalman_tracking ................................................. [PASS]
test_10_video_quality_validator ......................................... [PASS]
test_11_dribbling_metrics_calculation ................................... [PASS]
test_12_shooting_metrics_calculation .................................... [PASS]
test_13_ball_control_metrics_calculation ................................ [PASS]
test_14_foot_analysis ................................................... [PASS]
test_15_full_pipeline_assessment ........................................ [PASS]

----------------------------------------------------------------------
Ran 15 tests in 14.396s — OK (ALL TESTS PASSED)
```

---

## 6. Known Technical Limitations & Honest Disclosures

1. **Single-Camera 2D Scale Invariance:** Without calibrated depth sensors (LiDAR) or stereo cameras, physical shot power is reported as a **Relative Power Index (0 to 100)** rather than an uncalibrated km/h speed.
2. **COCO Class 32 vs Dedicated Football YOLO:** Generic YOLOv8 Nano operates on COCO Class 32 (`sports ball`). In extreme motion blur or distance, the multi-modal HSV pitch subtraction + Kalman filter bridges detection gaps. Support for custom fine-tuned weights is provided via `YOLO_MODEL_PATH`.
3. **Goalpost Visibility:** Because generic COCO models lack a goalpost class, structural Hough line detection is used. If goalposts are occluded or out of frame, goal conversion is marked `unavailable`.

---

## 7. Recommended Future Improvements

1. **Custom YOLOv11 Football Dataset:** Train on 10,000+ labeled grassroots football frames with classes: `[football, player, goalpost, cone, referee]`.
2. **Pitch Perspective Homography:** Auto-detect field lines (penalty box, touchline) to compute homography matrix $H$ for exact metric distance ($meters$).
3. **Multi-View Synchronization:** Support dual-phone multi-angle recording for 3D trajectory reconstruction.
