import os
import sys
import time
import argparse
import cv2

# Ensure UTF-8 output on Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Import custom PoseDetector module
from core.pose_detector import PoseDetector


def process_video(input_source, output_path="output_annotated.mp4", show_display=True):
    """
    Reads a video file (or webcam stream), runs MediaPipe pose detection on every frame,
    draws skeletal landmarks, displays real-time statistics, and saves the output video.
    """
    print("================================================================")
    print("ScoutX AI - Computer Vision Video Processing Pipeline")
    print("================================================================")
    print(f"[CONFIG] Input Source : {input_source}")
    print(f"[CONFIG] Output Video : {output_path}")

    # 1. Initialize Video Capture (OpenCV)
    if str(input_source).isdigit():
        cap = cv2.VideoCapture(int(input_source))
    else:
        if not os.path.exists(input_source):
            print(f"[ERROR] Video file '{input_source}' was not found!")
            print("Tip: Run 'python generate_test_video.py' to generate a sample video, or use '--webcam' to test live webcam.")
            return

        cap = cv2.VideoCapture(input_source)

    if not cap.isOpened():
        print(f"[ERROR] Could not open video source: {input_source}")
        return

    # 2. Get Video Properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
    fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"[INFO] Resolution   : {width} x {height}")
    print(f"[INFO] Input FPS    : {fps}")
    print(f"[INFO] Total Frames : {total_frames if total_frames > 0 else 'Live Stream'}")
    print("----------------------------------------------------------------")

    # 3. Initialize Video Writer for Saving Annotated Video
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # 4. Initialize MediaPipe Pose Detector
    print("[INFO] Initializing MediaPipe Pose Landmark Model...")
    detector = PoseDetector(
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5
    )
    print("[SUCCESS] Model ready. Starting frame-by-frame processing...\n")

    frame_count = 0
    prev_time = time.time()
    poses_detected_count = 0

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break  # Reached end of video

            frame_count += 1
            curr_time = time.time()
            fps_calc = 1.0 / (curr_time - prev_time) if (curr_time - prev_time) > 0 else fps
            prev_time = curr_time

            # 5. Detect Pose Landmarks on current frame
            result, annotated_frame = detector.find_pose(frame, draw=True)
            landmarks = detector.get_landmarks(frame, result)

            has_pose = len(landmarks) > 0
            if has_pose:
                poses_detected_count += 1

            # 6. Draw Dashboard Telemetry Overlay on Frame
            cv2.rectangle(annotated_frame, (10, 10), (380, 120), (15, 23, 42), -1)
            cv2.rectangle(annotated_frame, (10, 10), (380, 120), (56, 189, 248), 2)

            # Title
            cv2.putText(annotated_frame, "ScoutX AI - Pose Landmark Tracking",
                        (20, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (248, 250, 252), 2)

            # Status
            status_text = "Athlete Detected (33 points)" if has_pose else "Searching for Athlete..."
            status_color = (100, 255, 100) if has_pose else (100, 100, 255)
            cv2.putText(annotated_frame, f"Status: {status_text}",
                        (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.48, status_color, 1)

            # Progress & FPS
            progress_str = f"Frame: {frame_count}/{total_frames}" if total_frames > 0 else f"Frame: {frame_count}"
            cv2.putText(annotated_frame, f"{progress_str} | FPS: {fps_calc:.1f}",
                        (20, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

            # Sample Joint Telemetry
            if has_pose and len(landmarks) > 26:
                lk = landmarks[25]
                rk = landmarks[26]
                cv2.putText(annotated_frame, f"Knee L: ({lk['x_pixel']},{lk['y_pixel']}) | R: ({rk['x_pixel']},{rk['y_pixel']})",
                            (20, 108), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (56, 189, 248), 1)

            # 7. Write annotated frame to output video file
            out.write(annotated_frame)

            # 8. Display live preview window (if enabled)
            if show_display:
                cv2.imshow("ScoutX AI - Computer Vision Pipeline (Press 'q' to exit)", annotated_frame)
                
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q') or key == 27:
                    print("\n[INFO] Video processing stopped by user.")
                    break

            # Print terminal progress every 30 frames
            if frame_count % 30 == 0:
                percent = (frame_count / total_frames * 100) if total_frames > 0 else 0
                print(f"[PROGRESS] Processed {frame_count}/{total_frames} frames ({percent:.1f}%) | Current FPS: {fps_calc:.1f}")

    finally:
        # 9. Clean up resources
        cap.release()
        out.release()
        if show_display:
            cv2.destroyAllWindows()

    print("\n================================================================")
    print("[SUMMARY] Video Processing Completed!")
    print(f"Total Frames Processed : {frame_count}")
    print(f"Frames with Pose Tracked : {poses_detected_count} ({poses_detected_count / max(1, frame_count) * 100:.1f}%)")
    print(f"Annotated Output Saved  : {os.path.abspath(output_path)}")
    print("================================================================")


def main():
    parser = argparse.ArgumentParser(description="ScoutX AI - Pose Estimation & Video Processing Prototype")
    parser.add_argument("--video", type=str, default=None, help="Path to input video file (e.g. video.mp4)")
    parser.add_argument("--webcam", action="store_true", help="Use live laptop webcam as input")
    parser.add_argument("--demo", action="store_true", help="Automatically generate and process a synthetic sample athlete video")
    parser.add_argument("--output", type=str, default="output_annotated.mp4", help="Output annotated video path")
    parser.add_argument("--no-display", action="store_true", help="Disable live GUI display window")

    args = parser.parse_args()

    if args.webcam:
        process_video(0, output_path=args.output, show_display=not args.no_display)
    elif args.video:
        process_video(args.video, output_path=args.output, show_display=not args.no_display)
    else:
        sample_path = "sample_athlete.mp4"
        if not os.path.exists(sample_path) or args.demo:
            from generate_test_video import create_sample_athlete_video
            create_sample_athlete_video(sample_path)

        process_video(sample_path, output_path=args.output, show_display=not args.no_display)


if __name__ == "__main__":
    main()
