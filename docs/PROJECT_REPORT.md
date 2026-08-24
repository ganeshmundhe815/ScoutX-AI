# ⚽ ScoutX AI – Project Technical Report & Viva Guide

**PROJECT TITLE:** AI-Powered Mobile Platform for Democratizing Football Talent Assessment  
**PROJECT TYPE:** Full-Stack AI & Computer Vision Mobile Solution (SIH / Hackathon / Final Year Engineering)  
**DOMAIN:** Football (Soccer) Talent Assessment & Grassroots Scouting  

---

## 1. Executive Summary
**ScoutX AI** is an AI-powered mobile platform engineered specifically for **Football (Soccer)** to democratize talent discovery. In grassroots regions across India and worldwide, young players lack access to professional sports academies and scouting networks. ScoutX AI transforms any smartphone camera into an automated computer vision laboratory, evaluating football-specific drills—**Dribbling, Target Shooting, and Ball Control**—with real-time biomechanical analysis and zero human bias.

---

## 2. Platform Architecture

```text
               +-------------------------------------------+
               |         React Native (Expo SDK 57)        |
               |      Mobile UI (Player / Coach / Admin)   |
               +--------------------+----------------------+
                                    |
                            REST API / JSON
                                    |
               +--------------------v----------------------+
               |          Node.js + Express.js             |
               |      API Gateway (Port 5000)              |
               |  - Auth & RBAC (Player, Coach, Admin)     |
               |  - Football Player & Coach Profiles       |
               |  - Multer Video Upload Pipeline           |
               |  - Coach Search & Direct Messaging        |
               +----------+--------------------+-----------+
                          |                    |
                 Mongoose ODM /         HTTP Video Stream
                 In-Memory Engine              |
                          |                    |
               +----------v----+    +----------v-----------+
               | MongoDB Atlas |    |   Python Flask AI    |
               | Football DB   |    | Microservice (8000)  |
               +---------------+    | - MediaPipe 33-Pose  |
                                    | - YOLOv8 Ball Detect |
                                    | - OpenCV Video HUD   |
                                    | - NumPy Biomechanics |
                                    +----------------------+
```

---

## 3. The 3 Official Football Assessment Drills

### 1. ⚽ Slalom & Cone Dribbling Drill
* **Biomechanical Measurement:** Ball touch density, close control proximity index ($<0.6\text{m}$ from player), time to completion, and directional cut transitions.
* **AI Model:** MediaPipe 33-Landmark Pose + YOLO Ball Detection + Foot Proximity Analyzer (left vs right foot touch identification).

### 2. 🎯 Target Shooting & Finishing Drill
* **Biomechanical Measurement:** Shot release acceleration, on-target goal conversion %, ball trajectory toward corners vs center, and estimated relative shot power.
* **AI Model:** Optical velocity tracking across frames + Goal target quadrant detection.

### 3. 🤹 First Touch & Juggling (Ball Control) Drill
* **Biomechanical Measurement:** Consecutive touches without ball grounding, rebound deviation radius from foot, and two-footed distribution (Left % vs Right %).
* **AI Model:** MediaPipe Ankle & Toe tracking + Ball contact debounce detection.

---

## 4. User Roles & Workflows

1. **PLAYER:**
   - Registers with Football Position (*Striker, Winger, Midfielder, Defender, Goalkeeper*) and Preferred Foot (*Right, Left, Both*).
   - Records / uploads drill videos via mobile interface.
   - Receives instant AI performance scorecard (Dribbling, Shooting, Ball Control scores out of 100, national percentile ranking).
   - Unlocks verified football achievement badges.
   - Communicates directly with interested scouts.

2. **COACH / SCOUT:**
   - Advanced discovery grid to search and filter grassroots players by position, preferred foot, age, and AI scores.
   - Shortlists top prospects with scouting notes.
   - Direct messaging to invite players to trials.

3. **ADMIN:**
   - Platform analytics dashboard (total registered players, verified coaches, average national performance scores).
   - User account management and moderation.

---

## 5. How to Run the Entire System

### Step 1: Start Python AI Microservice (Port 8000)
```powershell
cd d:\Antigravity\mini_proj\code\ScoutX-AI\ai_service
python app.py
```

### Step 2: Start Express Backend API Server (Port 5000)
```powershell
cd d:\Antigravity\mini_proj\code\ScoutX-AI\backend
npm run dev
```

### Step 3: Start Expo Mobile App (Port 8081 / Web)
```powershell
cd d:\Antigravity\mini_proj\code\ScoutX-AI\frontend
npx expo start --web
```

### Step 4: Standalone Computer Vision Drill Test (Webcam or Video)
```powershell
cd d:\Antigravity\mini_proj\code\ScoutX-AI\ai_service

# Test Dribbling:
python analyze_drill.py --drill dribbling --webcam

# Test Shooting:
python analyze_drill.py --drill shooting --webcam

# Test Ball Control:
python analyze_drill.py --drill ball_control --webcam
```

---

## 6. Key Viva & Presentation Questions

1. **Why is ScoutX AI strictly for football?**
   * Generic multi-sport models fail to capture nuanced athletic skills. Football requires specific biomechanical tracking of ball-foot proximity, two-footed balance, shot trajectories, and positional benchmarks.

2. **How does ScoutX AI avoid false claims on shot speed?**
   * Without calibrated multi-camera stereoscopy, claiming exact km/h on random mobile phone cameras is unscientific. ScoutX AI uses a normalized **Estimated Shot Power Index** (0-100) based on frame-by-frame pixel displacement relative to body height.

3. **How does the system handle offline environments in rural grassroots areas?**
   * The backend includes an autonomous embedded storage engine (`embeddedStore.js`) that works immediately without MongoDB installation, and the AI pipeline runs locally on standard laptop CPUs.
