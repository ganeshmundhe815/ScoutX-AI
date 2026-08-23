import os
import sys
import json
import time
import argparse
import cv2

# Ensure UTF-8 output on Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from core.pose_detector import PoseDetector
from drills.squat_analyzer import SquatAnalyzer
from drills.pushup_analyzer import PushUpAnalyzer
from drills.jump_analyzer import VerticalJumpAnalyzer


def analyze_sports_drill(drill_type="squat", input_source=0, output_video=None, show_display=True):
    """
    Main Computer Vision Sports Assessment Engine:
    Processes video frame-by-frame, performs biomechanical angle analysis,
    counts valid reps, detects faults, and exports a final talent scorecard JSON.
    """
    print("================================================================")
    print(f"ScoutX AI - Biomechanical Drill Analysis: [{drill_type.upper()}]")
    print("================================================================")

    # 1. Initialize Video Capture
    if str(input_source).isdigit():
        cap = cv2.VideoCapture(int(input_source), cv2.CAP_DSHOW)
    else:
        if not os.path.exists(str(input_source)):
            print(f"[ERROR] Input video '{input_source}' was not found.")
            return None
        cap = cv2.VideoCapture(input_source)

    if not cap.isOpened():
        print(f"[ERROR] Could not open video source: {input_source}")
        return None

    # Video properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
    fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if not output_video:
        output_video = f"output_{drill_type}_analysis.mp4"

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video, fourcc, fps, (width, height))

    # 2. Initialize MediaPipe Detector & Drill Analyzer
    detector = PoseDetector(min_pose_detection_confidence=0.5)

    if drill_type == "squat":
        analyzer = SquatAnalyzer()
    elif drill_type == "pushup":
        analyzer = PushUpAnalyzer()
    elif drill_type == "jump":
        analyzer = VerticalJumpAnalyzer(fps=fps)
    else:
        print(f"[ERROR] Unknown drill type '{drill_type}'. Choose: squat, pushup, or jump.")
        return None

    print(f"[INFO] Initialized {drill_type.upper()} analyzer. Analyzing stream...\n")

    frame_idx = 0
    prev_time = time.time()
    last_drill_data = {}

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            frame_idx += 1
            curr_time = time.time()
            fps_calc = 1.0 / (curr_time - prev_time) if (curr_time - prev_time) > 0 else fps
            prev_time = curr_time

            # 3. Pose Detection
            result, annotated_frame = detector.find_pose(frame, draw=True)
            landmarks = detector.get_landmarks(frame, result)

            # 4. Biomechanical Analysis
            if drill_type in ["squat", "pushup"]:
                drill_data = analyzer.process_frame(landmarks)
            elif drill_type == "jump":
                drill_data = analyzer.process_frame(landmarks, frame_idx)

            last_drill_data = drill_data

            # 5. Draw Sports Science HUD Overlay
            # Top-left telemetry card
            cv2.rectangle(annotated_frame, (10, 10), (430, 140), (15, 23, 42), -1)
            cv2.rectangle(annotated_frame, (10, 10), (430, 140), (56, 189, 248), 2)

            # Header
            cv2.putText(annotated_frame, f"ScoutX AI - {drill_type.upper()} ASSESSMENT",
                        (20, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (248, 250, 252), 2)

            if drill_type in ["squat", "pushup"]:
                angle_val = drill_data.get('knee_angle' if drill_type == 'squat' else 'elbow_angle', 0.0)
                reps = drill_data.get('valid_reps', 0)
                total = drill_data.get('reps', 0)
                score = drill_data.get('form_score', 100.0)

                # Reps & Form Score
                cv2.putText(annotated_frame, f"VALID REPS: {reps} / {total} | Form: {score}%",
                            (20, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (100, 255, 100), 2)

                # Angle & State
                cv2.putText(annotated_frame, f"Angle: {int(angle_val)} deg | State: {drill_data.get('state')}",
                            (20, 88), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

            elif drill_type == "jump":
                height_cm = drill_data.get('jump_height_cm', 0.0)
                max_h = drill_data.get('max_jump_height_cm', 0.0)
                time_ms = drill_data.get('flight_time_ms', 0)

                cv2.putText(annotated_frame, f"HEIGHT: {height_cm} cm (Max: {max_h} cm)",
                            (20, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (100, 255, 100), 2)
                cv2.putText(annotated_frame, f"Flight Time: {time_ms} ms | State: {drill_data.get('state')}",
                            (20, 88), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

            # Live Coach Feedback string
            feedback_text = drill_data.get('feedback', '')
            cv2.putText(annotated_frame, f">> {feedback_text}",
                        (20, 118), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (56, 189, 248), 2)

            # 6. Save annotated video
            out.write(annotated_frame)

            # 7. Live Preview Window
            if show_display:
                cv2.imshow(f"ScoutX AI - {drill_type.upper()} Assessment", annotated_frame)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q') or key == 27:
                    print("\n[INFO] Assessment stopped by user.")
                    break

            if frame_idx % 30 == 0:
                print(f"[ANALYSIS] Frame {frame_idx} | {feedback_text}")

    finally:
        cap.release()
        out.release()
        if show_display:
            cv2.destroyAllWindows()

    # 8. Compile Final Talent Assessment Report
    report = {
        "drillType": drill_type,
        "totalFrames": frame_idx,
        "metrics": last_drill_data,
        "outputVideo": os.path.abspath(output_video),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    print("\n================================================================")
    print("🏆 FINAL ATHLETIC ASSESSMENT REPORT")
    print("================================================================")
    print(json.dumps(report, indent=2))
    print("================================================================")

    return report


def main():
    parser = argparse.ArgumentParser(description="ScoutX AI - Biomechanical Drill Analysis")
    parser.add_argument("--drill", type=str, default="squat", choices=["squat", "pushup", "jump"], help="Drill type to evaluate")
    parser.add_argument("--video", type=str, default=None, help="Path to video file")
    parser.add_argument("--webcam", action="store_true", help="Use live laptop webcam")
    parser.add_argument("--output", type=str, default=None, help="Output annotated video path")
    parser.add_argument("--no-display", action="store_true", help="Run without live GUI window")

    args = parser.parse_args()

    input_src = 0 if args.webcam else (args.video or "sample_athlete.mp4")
    analyze_sports_drill(
        drill_type=args.drill,
        input_source=input_src,
        output_video=args.output,
        show_display=not args.no_display
    )


if __name__ == "__main__":
    main()
