import cv2
import numpy as np


class VideoQualityValidator:
    """
    Validates mobile football video quality prior to and during computer vision analysis:
    - Resolution & Aspect Ratio
    - Frame Rate (FPS)
    - Video Duration
    - Lighting Brightness & Contrast
    - Motion Blur (Laplacian Variance)
    - Player & Ball Visibility Ratios
    """
    def __init__(self, min_width=480, min_height=360, min_fps=15, min_duration=2.0, max_duration=120.0):
        self.min_width = min_width
        self.min_height = min_height
        self.min_fps = min_fps
        self.min_duration = min_duration
        self.max_duration = max_duration

    def validate_video_properties(self, cap, video_path):
        """
        Validates basic container and codec properties.
        """
        warnings = []
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
        fps = float(cap.get(cv2.CAP_PROP_FPS)) or 30.0
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        duration = round(frame_count / fps, 2) if fps > 0 else 0.0

        if width < self.min_width or height < self.min_height:
            warnings.append(f"Low resolution ({width}x{height}). Recommended: 720p or 1080p for clear joint tracking.")

        if fps < self.min_fps:
            warnings.append(f"Low frame rate ({fps:.1f} FPS). Fast ball motion may experience frame gaps.")

        if duration < self.min_duration:
            warnings.append(f"Video duration is very short ({duration}s). Minimum 3-5 seconds of drill action recommended.")
        elif duration > self.max_duration:
            warnings.append(f"Video duration exceeds {self.max_duration}s. Analyzing first segment.")

        return {
            "resolution": f"{width}x{height}",
            "width": width,
            "height": height,
            "fps": round(fps, 1),
            "durationSec": duration,
            "totalFrames": frame_count,
            "warnings": warnings,
        }

    def compute_frame_quality(self, frame):
        """
        Computes brightness, contrast, and blur metrics for a sample frame.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        contrast = float(np.std(gray))
        blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        return {
            "brightness": round(brightness, 1),
            "contrast": round(contrast, 1),
            "blurScore": round(blur_variance, 1),
            "is_dark": brightness < 45.0,
            "is_overexposed": brightness > 230.0,
            "is_blurry": blur_variance < 35.0,
        }

    def finalize_quality_report(self, props, frame_qualities, ball_detected_count, player_detected_count, total_frames):
        """
        Produces the final Video Quality Assessment and confidence score (0 to 100).
        """
        warnings = list(props.get("warnings", []))
        total = max(1, total_frames)

        ball_visibility_pct = round((ball_detected_count / float(total)) * 100.0, 1)
        player_visibility_pct = round((player_detected_count / float(total)) * 100.0, 1)

        if ball_visibility_pct < 35.0:
            warnings.append(f"Ball detected in only {ball_visibility_pct}% of frames. Place camera closer to the drill area.")
        elif ball_visibility_pct < 60.0:
            warnings.append(f"Intermittent ball visibility ({ball_visibility_pct}%). Some touches interpolated.")

        if player_visibility_pct < 50.0:
            warnings.append(f"Athlete visible in only {player_visibility_pct}% of frames. Keep athlete in full view.")

        avg_brightness = float(np.mean([fq["brightness"] for fq in frame_qualities])) if frame_qualities else 120.0
        avg_blur = float(np.mean([fq["blurScore"] for fq in frame_qualities])) if frame_qualities else 100.0

        if avg_brightness < 45.0:
            warnings.append("Low lighting detected. Record in daylight or well-lit turf.")
        elif avg_brightness > 230.0:
            warnings.append("Overexposed video lighting. Avoid direct sunlight into camera lens.")

        if avg_blur < 40.0:
            warnings.append("Significant motion blur detected. Use stable camera mount or tripod.")

        # Compute Composite Video Quality Score (0 - 100)
        q_score = (
            (min(100.0, player_visibility_pct) * 0.40) +
            (min(100.0, ball_visibility_pct) * 0.35) +
            (min(100.0, max(20.0, avg_blur / 2.0)) * 0.15) +
            (min(100.0, max(20.0, 100.0 - abs(avg_brightness - 128.0) * 0.8)) * 0.10)
        )
        quality_score = round(float(np.clip(q_score, 20.0, 100.0)), 1)

        return {
            "resolution": props.get("resolution", "640x360"),
            "fps": props.get("fps", 30.0),
            "durationSec": props.get("durationSec", 0.0),
            "qualityScore": quality_score,
            "ballVisibilityPercentage": ball_visibility_pct,
            "playerVisibilityPercentage": player_visibility_pct,
            "averageBrightness": round(avg_brightness, 1),
            "motionStabilityScore": round(min(100.0, avg_blur), 1),
            "warnings": warnings,
            "is_acceptable": quality_score >= 40.0,
        }
