# 🏆 ScoutX AI – Project Technical Report & Viva Guide
### *AI-Powered Mobile Platform for Democratizing Sports Talent Assessment*
**Problem Statement:** SIH25073 (Ministry of Youth Affairs & Sports / Khelo India KIRTI)

---

## 1. Executive Summary
Grassroots talent identification across India faces major geographical and financial barriers. Millions of talented athletes in rural, tier-2, and tier-3 regions lack access to expensive sports biomechanics labs or accredited scouts. 

**ScoutX AI** is an end-to-end, mobile-first ecosystem that transforms any smartphone camera into a portable **AI Sports Science Assessment Lab**. Using on-device and cloud Computer Vision (MediaPipe Pose + OpenCV), the platform automatically calculates athletic performance metrics (rep counts, $90^\circ$ joint flexion, torso alignment, flight-time jump height), benchmarks them against official **Sports Authority of India (SAI)** standards, and publishes verified athletic profiles to a national **Scout Discovery Portal**.

---

## 2. System Architecture

```mermaid
graph TD
    subgraph Frontend Layer [📱 React Native Mobile App - Expo]
        A1[Splash & Onboarding]
        A2[Athlete Drill Portal]
        A3[Scout Discovery & Leaderboard]
    end

    subgraph Backend API Gateway [🟢 Node.js / Express.js Server - Port 5000]
        B1[JWT Authentication & Bcrypt]
        B2[Multer Video Upload Gateway]
        B3[Khelo India Radar Scoring Engine]
        B4[AI Communication Bridge]
    end

    subgraph AI Computer Vision Engine [🧠 Python Microservice - Port 8000]
        C1[OpenCV Frame Ingestion]
        C2[MediaPipe 33-Landmark Pose Detection]
        C3[Trigonometric Angle Math np.arctan2]
        C4[Squat, Push-up & Jump Analyzers]
    end

    subgraph Database Layer [🍃 MongoDB Database]
        D1[(Users Collection)]
        D2[(Athletes Collection)]
        D3[(PerformanceResults Collection)]
        D4[(VideoRecords Collection)]
    end

    Frontend Layer -->|REST API & Video Uploads| Backend API Gateway
    Backend API Gateway -->|Stores Data & Percentiles| Database Layer
    Backend API Gateway -->|POST /api/ai/analyze| AI Computer Vision Engine
    AI Computer Vision Engine -->|JSON Metrics & Biomechanical Faults| Backend API Gateway
```

---

## 3. Biomechanical Formulas & Sports Science Logic

### 1. 3-Point Joint Flexion Angle
The angle $\theta$ at joint $B$ formed by points $A \rightarrow B \rightarrow C$ (e.g. $\text{Hip} \rightarrow \text{Knee} \rightarrow \text{Ankle}$) is calculated as:
$$\theta = \left| \operatorname{atan2}(C_y - B_y, C_x - B_x) - \operatorname{atan2}(A_y - B_y, A_x - B_x) \right| \times \frac{180}{\pi}$$
* Normalized to range $[0^\circ, 180^\circ]$.

### 2. Vertical Jump Height (Projectile Physics)
Vertical jump height $h$ (in centimeters) is derived from flight time $\Delta t = (t_{\text{land}} - t_{\text{takeoff}})$ in seconds:
$$h = \frac{1}{8} \times g \times (\Delta t)^2$$
where $g = 981 \text{ cm/s}^2$.

### 3. Khelo India 5-Axis Radar Score
$$S_{\text{overall}} = \frac{S_{\text{power}} + S_{\text{endurance}} + S_{\text{strength}} + S_{\text{agility}} + S_{\text{flexibility}}}{5}$$
* National Percentile is normalized by age bracket and gender distributions.

---

## 4. Top 15 Project Viva Questions & Answers (For Examiner / Panel)

### Q1: What is the main objective of ScoutX AI?
> **Answer:** To democratize grassroots sports talent discovery in India by allowing athletes to record standard physical tests on any smartphone, using computer vision to evaluate their biomechanical form against Sports Authority of India (SAI) benchmarks without expensive equipment.

### Q2: Why did you choose MediaPipe Pose over YOLOv8-pose or OpenPose?
> **Answer:** MediaPipe Pose uses lightweight BlazePose architecture (MobileNet backbone), detecting 33 3D skeletal landmarks with sub-millisecond CPU inference speeds (60+ FPS on laptops/smartphones), making it ideal for rural deployment without costly GPUs.

### Q3: How does the system prevent cheating or false repetitions?
> **Answer:** We implemented a finite State Machine (`UP` $\leftrightarrow$ `DOWN`). A repetition is only counted if the joint angle descends below $90^\circ$ and then fully locks out above $160^\circ$. If the athlete does not reach full depth, the system flags an "Incomplete depth" fault and awards no count.

### Q4: How is Vertical Jump Height measured without sensors?
> **Answer:** We track the ankle and toe landmark displacement to detect the exact takeoff and landing timestamps. Using the projectile kinematic formula $h = \frac{1}{8} g t^2$, we calculate height directly from flight time.

### Q5: How do the frontend, backend, and AI service communicate?
> **Answer:** React Native uploads the video to the Express backend via multipart/form-data. Express forwards it to the Python Flask AI service over REST (`POST /api/ai/analyze`). The AI returns parsed JSON metrics, which Express stores in MongoDB and returns to the mobile app.

### Q6: How are user passwords secured?
> **Answer:** Passwords are never stored in plain text. They are salted and encrypted using `bcryptjs` with 10 salt rounds. Authentication sessions are managed using digitally signed JSON Web Tokens (JWT).

### Q7: What are the 5 axes on the Khelo India Radar Chart?
> **Answer:** Explosive Power (Jump), Muscular Endurance (Push-ups), Lower-body Strength (Squats), Agility & Speed (Shuttle Run), and Flexibility (Reach).

### Q8: What database is used and why?
> **Answer:** MongoDB with Mongoose ODM. Its flexible document structure natively accommodates complex JSON metric trees (angles, timestamp arrays, fault logs) without complex SQL joins.

---

## 5. How to Run the Entire Ecosystem (Quick Guide)

| Component | Directory | Terminal Command | Port / URL |
| :--- | :--- | :--- | :--- |
| **🟢 Express Backend** | `backend/` | `npm run dev` | `http://localhost:5000` |
| **🧠 Python AI Microservice** | `ai_service/` | `python app.py` | `http://localhost:8000` |
| **📱 React Native App** | `frontend/` | `npx expo start --web` | `http://localhost:8081` |
