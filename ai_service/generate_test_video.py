import os
import sys
import cv2
import numpy as np

# Ensure UTF-8 output on Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def create_sample_athlete_video(output_path="sample_athlete.mp4", duration_sec=5, fps=30):
    """
    Generates a 5-second sample MP4 video of an animated figure performing
    squats to test the Computer Vision pipeline without needing an external video file.
    """
    width, height = 640, 480
    total_frames = duration_sec * fps
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    print(f"[INFO] Generating {duration_sec}-second sample athlete video at '{output_path}'...")

    for frame_idx in range(total_frames):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        frame[:] = (20, 24, 33) # Dark sports background

        # Ground line
        cv2.line(frame, (50, 420), (590, 420), (70, 80, 100), 2)

        # Title text
        cv2.putText(frame, "ScoutX AI - Sample Athlete Test Video", (30, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
        cv2.putText(frame, f"Frame: {frame_idx + 1}/{total_frames}", (30, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 200, 255), 1)

        # Animated squatting motion
        progress = (frame_idx % (fps * 2)) / (fps * 2)
        squat_depth = np.sin(progress * 2 * np.pi) * 35

        head_center = (320, int(150 + squat_depth))
        neck = (320, int(180 + squat_depth))
        hips = (320, int(270 + squat_depth))
        
        l_knee = (280, int(340 + squat_depth * 0.4))
        r_knee = (360, int(340 + squat_depth * 0.4))
        
        l_ankle = (280, 410)
        r_ankle = (360, 410)
        
        l_shoulder = (270, int(200 + squat_depth))
        r_shoulder = (370, int(200 + squat_depth))
        
        l_wrist = (250, int(270 + squat_depth))
        r_wrist = (390, int(270 + squat_depth))

        # Draw athlete joints and limbs
        cv2.circle(frame, head_center, 25, (220, 220, 220), -1)
        cv2.line(frame, neck, hips, (200, 200, 200), 4)
        cv2.line(frame, neck, l_shoulder, (200, 200, 200), 4)
        cv2.line(frame, l_shoulder, l_wrist, (200, 200, 200), 4)
        cv2.line(frame, neck, r_shoulder, (200, 200, 200), 4)
        cv2.line(frame, r_shoulder, r_wrist, (200, 200, 200), 4)
        cv2.line(frame, hips, l_knee, (200, 200, 200), 4)
        cv2.line(frame, l_knee, l_ankle, (200, 200, 200), 4)
        cv2.line(frame, hips, r_knee, (200, 200, 200), 4)
        cv2.line(frame, r_knee, r_ankle, (200, 200, 200), 4)

        out.write(frame)

    out.release()
    print(f"[SUCCESS] Sample video created successfully ({total_frames} frames).")

if __name__ == "__main__":
    create_sample_athlete_video()
