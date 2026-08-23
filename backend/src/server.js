const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Import Route Handlers
const healthRoutes = require('./routes/health.routes');
const dbRoutes = require('./routes/db.routes');
const authRoutes = require('./routes/auth.routes');
const athleteRoutes = require('./routes/athlete.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const scoutRoutes = require('./routes/scout.routes');
const errorHandler = require('./middleware/errorHandler');

// 1. Load environment variables
dotenv.config();

// 2. Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// 3. Global Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded drill videos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logger
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// 4. API Routes Gateway
app.use('/api/health', healthRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/scouts', scoutRoutes);

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    project: 'ScoutX AI – Sports Talent Assessment Platform 🏆',
    status: 'Active',
    message: 'Welcome to ScoutX AI Unified API Gateway 🚀',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      dbStatus: 'GET /api/db/status',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      athleteDashboard: 'GET /api/athletes/dashboard (Protected)',
      aiAssessment: 'POST /api/assessments/analyze (Upload Video)',
      scoutLeaderboard: 'GET /api/scouts/leaderboard',
    },
  });
});

// 5. 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Cannot find endpoint '${req.originalUrl}' on this server.`,
  });
});

// 6. Global Centralized Error Handler
app.use(errorHandler);

// 7. Start the Express Server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 ScoutX AI Backend Server running on port ${PORT}`);
  console.log(`🔗 Health Check:      http://localhost:${PORT}/api/health`);
  console.log(`🔑 Auth Endpoints:    http://localhost:${PORT}/api/auth`);
  console.log(`🏃 Athlete Portal:    http://localhost:${PORT}/api/athletes`);
  console.log(`🧠 AI Assessments:    POST http://localhost:${PORT}/api/assessments/analyze`);
  console.log(`🏆 Scout Leaderboard: http://localhost:${PORT}/api/scouts/leaderboard`);
  console.log('====================================================');
});
