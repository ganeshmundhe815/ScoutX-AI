# 🌐 100% Free Hosting & Demo Guide (Zero Credit Card Required)

This guide provides two intelligent, completely free methods to make **ScoutX AI** accessible to anyone over the internet.

---

## ⚡ Method 1: Instant 1-Command Public Tunnel (Best for College Demo & Viva)

Run the backend on your laptop, and expose it instantly to the internet with a public HTTPS link:

### How to use:
1. **Start the backend server** in your first terminal:
   ```powershell
   cd D:\Antigravity\mini_proj\code\ScoutX-AI\backend
   npm run dev
   ```
2. **Open a new terminal tab and start the tunnel**:
   ```powershell
   cd D:\Antigravity\mini_proj\code\ScoutX-AI\backend
   npm run tunnel
   ```
3. It will print a live public HTTPS URL, for example:
   ```text
   your url is: https://scoutx-demo.loca.lt
   ```
4. Anyone on their mobile phone (even on mobile data 4G/5G) can now communicate with your backend!

---

## 🚀 Method 2: Permanent Free Cloud Hosting via Render.com

[Render.com](https://render.com) offers **100% free hosting forever with no credit card required**.

We have already added a pre-configured **`render.yaml` Blueprint** to your project.

### 3-Step Setup:
1. Push your `ScoutX-AI` folder to **GitHub**.
2. Go to **[dashboard.render.com](https://dashboard.render.com)** (sign in with your GitHub account).
3. Click **New +** $\rightarrow$ **Blueprint** $\rightarrow$ Select your GitHub repository.
4. Render will read `render.yaml` and automatically deploy:
   * **Node.js Express Backend:** `https://scoutx-backend.onrender.com`
   * **Python AI Microservice:** `https://scoutx-ai-service.onrender.com`

---

## 📱 Updating the Mobile App Endpoint:
When you deploy to cloud, open `frontend/src/services/apiConfig.js` and set:
```javascript
const USE_CLOUD = true;
const CLOUD_API_URL = 'https://YOUR_RENDER_URL.onrender.com/api';
```
