# 🐳 ScoutX AI – Docker Deployment & Portability Guide

Complete guide to running the entire **ScoutX AI Football Talent Assessment Platform** in Docker containers on any computer (Windows, macOS, Linux) with a single command.

---

## 🏗️ Containerized Architecture Overview

The ScoutX AI application consists of 4 microservices configured with Docker Compose:

```
+-----------------------------------------------------------------------------------+
|                                ScoutX-AI Network                                  |
|                                                                                   |
|   +-------------------+       +-------------------+       +-------------------+   |
|   |  scoutx_frontend  | ----> |  scoutx_backend   | ----> | scoutx_ai_service |   |
|   |   (React Native/  |       |   (Node Express)  |       |   (Python CV      |   |
|   |    Expo Web)      |       |                   |       |    MediaPipe/YOLO)|   |
|   |   Port: 8081      |       |   Port: 5000      |       |   Port: 8000      |   |
|   +-------------------+       +-------------------+       +-------------------+   |
|             |                           |                           |             |
|             |                           +------------+              |             |
|             |                                        |              |             |
|             |                                        v              v             |
|             |                             +-----------------------------------+   |
|             |                             |    Shared Video Uploads Volume    |   |
|             |                             |        (./backend/uploads)        |   |
|             |                             +-----------------------------------+   |
|             |                                        |                            |
|             |                                        v                            |
|             |                             +-------------------+                   |
|             |                             |  scoutx_mongodb   |                   |
|             +---------------------------> |     (Mongo 7.0)   |                   |
|                                           |   Port: 27017     |                   |
|                                           +-------------------+                   |
+-----------------------------------------------------------------------------------+
```

### Services & Port Mappings

| Service Name | Container Name | Technology Stack | Host Port | Internal Container URL |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `scoutx_frontend` | React Native + Expo Web | `8081` | `http://frontend:8081` |
| **Backend** | `scoutx_backend` | Node.js + Express + Mongoose | `5000` | `http://backend:5000` |
| **AI Engine** | `scoutx_ai_service` | Python 3.10 + MediaPipe + YOLOv8 + Flask | `8000` | `http://ai_service:8000` |
| **Database** | `scoutx_mongodb` | Official MongoDB 7.0 Community | `27017` | `mongodb://mongodb:27017` |

---

## 📋 Prerequisites

1. **Docker Desktop**:
   - Download & Install: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - On Windows: ensure **WSL 2 backend** is enabled during installation.
2. **Start Docker Desktop**:
   - Open Docker Desktop and verify the bottom-left icon is green (**"Engine running"**).

---

## 🚀 Quick Start (One-Click)

### On Windows
Simply double-click:
```bat
docker-start.bat
```
This script will:
1. Verify Docker installation and engine status.
2. Auto-detect your computer's LAN IP.
3. Build and launch all 4 microservice containers.
4. Display clickable URLs and stream live logs.

### To Stop Containers
Double-click:
```bat
docker-stop.bat
```

---

## 🛠️ Manual Docker Commands

If you prefer using the terminal (PowerShell, Command Prompt, macOS/Linux Terminal):

### 1. Build and Start All Services
```bash
docker compose up --build -d
```

### 2. View Live Logs
```bash
docker compose logs -f
```
Or for a specific service:
```bash
docker compose logs -f backend
docker compose logs -f ai_service
docker compose logs -f frontend
```

### 3. Check Container Status
```bash
docker compose ps
```

### 4. Stop All Containers
```bash
docker compose down
```

### 5. Stop and Wipe Persistent MongoDB Volume (Reset Data)
```bash
docker compose down -v
```

---

## 🌐 Sharing on LAN / Accessing from Another Computer

You can easily run ScoutX AI on your main computer and access it from any phone, laptop, or tablet connected to the same Wi-Fi network.

### Step 1: Find Host IP Address
On the host computer, open PowerShell or CMD:
```cmd
ipconfig
```
Look for **IPv4 Address** (e.g. `192.168.1.79`).

### Step 2: Allow Ports Through Windows Firewall (One-Time Setup)
Run PowerShell as Administrator on the host computer:
```powershell
New-NetFirewallRule -DisplayName "ScoutX-AI Services" -Direction Inbound -LocalPort 8081,5000,8000 -Protocol TCP -Action Allow
```

### Step 3: Open on Any Device on the Network
On your friend's laptop, tablet, or phone browser:
- **Web App**: `http://<HOST_IP>:8081` (e.g., `http://192.168.1.79:8081`)
- The app automatically connects to the backend at `http://<HOST_IP>:5000/api` without any manual configuration!

---

## 👥 Demo Logins for All 3 Roles

The application comes pre-configured with dedicated accounts for each role:

| Role | Email | Password | Features / Dashboard |
| :--- | :--- | :--- | :--- |
| **⚽ Player** | `neeraj@scoutx.com` | `password123` | AI Football Drill Uploads (Dribbling, Shooting, Ball Control), Radar Benchmark, National Percentile, Direct Messaging |
| **📋 Coach / Scout** | `coach@scoutx.com` | `password123` | Talent Discovery Search, Player Shortlist & Bookmarking, Metric Filtering, Direct Contact Messaging |
| **👑 Administrator** | `admin@scoutx.com` | `password123` | Platform Analytics, User Management (Toggle/Ban/Delete), System Health, Assessment Audits |

---

## ⚙️ Environment Variables Reference

A `.env.example` file is included in the project root:

```env
# Backend & Database Configuration
PORT_BACKEND=5000
MONGO_URI=mongodb://mongodb:27017/scoutx_db
JWT_SECRET=scoutx_jwt_super_secret_key_sih2025_khelo_india

# AI Microservice Configuration
PORT_AI=8000
AI_SERVICE_URL=http://ai_service:8000

# Frontend Dynamic API Configuration
PORT_FRONTEND=8081
# Leave empty for dynamic auto-resolution, or specify explicit endpoint:
# EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

---

## ❓ Troubleshooting & FAQ

### 1. `Docker is not recognized as an internal or external command`
- **Solution**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and ensure Docker's `bin` path is added to your environment `PATH`. Restart your terminal after installing.

### 2. `Ports 5000, 8081, or 8000 are already in use`
- **Solution**: Check if you have local processes running without Docker (e.g., local Node.js or Python). Stop them before starting Docker:
  ```powershell
  # On Windows PowerShell to find process on port 5000:
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
  ```

### 3. How do uploaded videos get analyzed between Backend and AI Engine?
- The Docker Compose configuration mounts `./backend/uploads` to `/app/uploads` in both the `backend` and `ai_service` containers as a shared volume. When a player uploads a video, both containers access the file directly without unnecessary network streaming latency.

### 4. Running Without Docker
- If you prefer running without Docker, simply double-click `start_project.bat` to launch Node.js, Python Flask, and Expo directly on your host machine.
