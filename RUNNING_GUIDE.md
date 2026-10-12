# 🚀 How to Run ScoutX AI Using Terminals

This guide provides three easy ways to run the complete **ScoutX AI** system (Python AI Microservice, Node.js Backend, and Expo Frontend).

---

## ⚡ Method 1: 1-Click Double-Click (Easiest)

Simply double-click the file in the project folder:

📁 **`START_PROJECT.bat`**

This will automatically open 3 separate terminal windows and start all services in the correct order.

---

## 🐳 Method 2: 1-Click Docker Container Launch (Portable)

If you have **Docker Desktop** installed:

📁 **`docker-start.bat`**

Or run `docker compose up --build -d`. See [DOCKER_SETUP.md](DOCKER_SETUP.md) for full instructions.

---

## ⚡ Method 3: PowerShell 1-Line Command

Open **PowerShell** in the project root (`d:\Antigravity\mini_proj\code\ScoutX-AI`) and run:

```powershell
.\start_project.ps1
```

---

## 💻 Method 3: Manual Step-by-Step (3 Terminals)

If you prefer running each service manually in your own terminal tabs:

### 🟢 Terminal 1: Python AI Computer Vision Microservice (Port 8000)
```powershell
cd d:\Antigravity\mini_proj\code\ScoutX-AI\ai_service
python app.py
```
* **Runs on:** `http://localhost:8000`
* **Features:** MediaPipe Pose 33-Landmarks, YOLO Object Detection, Kalman 2D Tracker.

---

### 🟢 Terminal 2: Node.js Express Backend API (Port 5000)
```powershell
cd d:\Antigravity\mini_proj\code\ScoutX-AI\backend
npm run dev
```
* **Runs on:** `http://localhost:5000`
* **Features:** JWT Auth, Role Middleware, Player/Coach/Admin Routes, Autonomous Embedded Database.

---

### 🟢 Terminal 3: Expo React Native Frontend (Port 8081)
```powershell
cd d:\Antigravity\mini_proj\code\ScoutX-AI\frontend
npx expo start --web --port 8081
```
* **Runs on:** `http://localhost:8081`
* **Features:** Responsive Web & Mobile Interface for Player, Coach, and Admin.

---

## 🌐 Application URLs & Ports

| Service | Port | URL / Health Check |
|---|---|---|
| **Frontend Web App** | `8081` | [http://localhost:8081](http://localhost:8081) |
| **Backend API** | `5000` | [http://localhost:5000/api/health](http://localhost:5000/api/health) |
| **Python AI Engine** | `8000` | [http://localhost:8000/health](http://localhost:8000/health) |

---

## 🔑 Demo Accounts (Pre-Seeded)

All demo accounts use password: **`password123`**

| Role | Email | Password | Primary Experience |
|---|---|---|---|
| **⚽ Player** | `player@scoutx.com` | `password123` | Technical Radar, AI Drill Recording, Profile Edit, Badges, Coach Messages. |
| **🛡️ Coach** | `coach@scoutx.com` | `password123` | Talent Discovery Multi-Filter, Scouting Profile Modal, Shortlist Manager. |
| **⚙️ Admin** | `admin@scoutx.com` | `password123` | Platform KPI Metrics, User Management (Activate/Deactivate Toggle), AI Audit Logs. |

---

## 📱 Mobile Phone Access (Over Wi-Fi)

To open the app on your physical mobile phone connected to the same Wi-Fi:
1. Open Chrome / Safari on your phone.
2. Visit: `http://192.168.1.79:8081`
3. If Chrome alerts about local HTTP: Tap **"Advanced"** → **"Proceed to 192.168.1.79 (unsafe)"**.
4. (Optional) Tap **"Add to Home screen"** to install as a native-feel mobile app!
