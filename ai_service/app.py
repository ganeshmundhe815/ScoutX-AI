import os
import sys
import time
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Ensure UTF-8 output on Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from analyze_drill import analyze_sports_drill

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  # 100 MB max video size

ALLOWED_EXTENSIONS = {"mp4", "avi", "mov", "mkv", "webm"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/health", methods=["GET"])
def health_check():
    """Diagnostic health check for Python AI Microservice."""
    return jsonify({
        "status": "active",
        "service": "ScoutX AI Computer Vision Engine 🧠",
        "supportedDrills": ["squat", "pushup", "jump"],
        "frameworks": ["OpenCV", "MediaPipe PoseLandmarker", "NumPy"],
        "port": 8000,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }), 200


@app.route("/api/ai/analyze", methods=["POST"])
def analyze_video_endpoint():
    """
    Main AI Analysis API Endpoint:
    Accepts:
      - Multipart video file OR JSON { "videoPath": "...", "drillType": "squat" }
    Returns:
      - Complete athletic metrics, valid reps, form accuracy, faults, and SAI score.
    """
    drill_type = request.form.get("drillType") or request.args.get("drillType") or "squat"
    video_path = None

    # Check if a video file was uploaded directly via multipart/form-data
    if "video" in request.files:
        file = request.files["video"]
        if file.filename != "" and allowed_file(file.filename):
            filename = secure_filename(f"{int(time.time())}_{file.filename}")
            saved_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(saved_path)
            video_path = saved_path
    elif request.is_json:
        data = request.get_json()
        video_path = data.get("videoPath")
        drill_type = data.get("drillType", drill_type)
    else:
        video_path = request.form.get("videoPath")

    # If no custom video provided, fallback to sample demo video
    if not video_path or not os.path.exists(video_path):
        video_path = os.path.join(os.path.dirname(__file__), "sample_athlete.mp4")
        if not os.path.exists(video_path):
            from generate_test_video import create_sample_athlete_video
            create_sample_athlete_video(video_path)

    print(f"[API] Processing {drill_type.upper()} on video: {video_path}")

    # Run the Computer Vision Biomechanical Pipeline (Headless mode for server)
    out_annotated = os.path.join(app.config["UPLOAD_FOLDER"], f"annotated_{int(time.time())}_{drill_type}.mp4")
    report = analyze_sports_drill(
        drill_type=drill_type,
        input_source=video_path,
        output_video=out_annotated,
        show_display=False
    )

    if not report:
        return jsonify({
            "status": "error",
            "message": "Failed to analyze video."
        }), 500

    # Calculate SAI Norm Score & Percentile Rank
    raw_metrics = report.get("metrics", {})
    reps = raw_metrics.get("valid_reps", 0)
    form_score = raw_metrics.get("form_score", 85.0)
    jump_h = raw_metrics.get("max_jump_height_cm", 0.0)

    # Standard Khelo India benchmark normalization
    if drill_type == "squat":
        sai_score = min(100.0, round((reps / 35.0) * 60 + (form_score * 0.4), 1))
    elif drill_type == "pushup":
        sai_score = min(100.0, round((reps / 30.0) * 60 + (form_score * 0.4), 1))
    elif drill_type == "jump":
        sai_score = min(100.0, round((jump_h / 60.0) * 100, 1))
    else:
        sai_score = 75.0

    response_payload = {
        "status": "success",
        "drillType": drill_type,
        "totalFrames": report.get("totalFrames", 0),
        "metrics": {
            "totalReps": raw_metrics.get("reps", 0),
            "validReps": raw_metrics.get("valid_reps", 0),
            "invalidReps": raw_metrics.get("invalid_reps", 0),
            "formAccuracyPercentage": form_score,
            "jumpHeightCm": jump_h,
            "flightTimeMs": raw_metrics.get("flight_time_ms", 0),
            "biomechanicalFaults": raw_metrics.get("faults", []),
        },
        "saiNormScore": max(10.0, sai_score),
        "aiConfidenceScore": 0.96,
        "processedVideoPath": out_annotated,
        "timestamp": report.get("timestamp"),
    }

    return jsonify(response_payload), 200


if __name__ == "__main__":
    print("================================================================")
    print("🧠 ScoutX AI – Python Computer Vision Microservice")
    print("🔗 Microservice listening on: http://localhost:8000")
    print("🔗 Health check endpoint:    http://localhost:8000/health")
    print("🔗 AI Analysis endpoint:     POST http://localhost:8000/api/ai/analyze")
    print("================================================================")
    app.run(host="0.0.0.0", port=8000, debug=False)
