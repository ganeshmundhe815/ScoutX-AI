import os
import sys
import argparse

# Ensure UTF-8 output on Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from football.football_assessment import run_football_assessment


def main():
    parser = argparse.ArgumentParser(description="ScoutX AI - Football Performance Analysis Engine")
    parser.add_argument(
        "--drill",
        type=str,
        default="dribbling",
        choices=["dribbling", "shooting", "ball_control"],
        help="Football drill to evaluate (dribbling, shooting, ball_control)"
    )
    parser.add_argument("--video", type=str, default=None, help="Path to video file or IP camera stream URL")
    parser.add_argument("--webcam", action="store_true", help="Use live laptop/USB camera")
    parser.add_argument("--output", type=str, default=None, help="Output annotated video path")
    parser.add_argument("--no-display", action="store_true", help="Run without live GUI window")

    args = parser.parse_args()

    input_src = 0 if args.webcam else (args.video or "sample_athlete.mp4")
    run_football_assessment(
        drill_type=args.drill,
        input_source=input_src,
        output_video=args.output,
        show_display=not args.no_display
    )


if __name__ == "__main__":
    main()
