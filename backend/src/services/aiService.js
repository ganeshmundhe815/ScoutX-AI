const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const formatAiServiceUrl = (rawUrl) => {
  if (!rawUrl) return 'http://localhost:8000';
  const clean = rawUrl.trim().replace(/\/+$/, '');
  // If bare service name without dots or ports (e.g. 'scoutx-ai-service' from Render Blueprint)
  if (!clean.includes('.') && !clean.includes('localhost') && !clean.includes(':')) {
    return `https://${clean}.onrender.com`;
  }
  if (!/^https?:\/\//i.test(clean)) {
    // If cloud domain provided without protocol
    if (clean.includes('.onrender.com') || clean.includes('.railway.app') || clean.includes('.fly.dev') || clean.includes('.koyeb.app')) {
      return `https://${clean}`;
    }
    return `http://${clean}`;
  }
  return clean;
};

const AI_SERVICE_URL = formatAiServiceUrl(process.env.AI_SERVICE_URL);
const AI_PROCESSING_TIMEOUT_MS = 120000; // 120s safety ceiling for long video processing

/**
 * Health check to verify if Python AI Computer Vision microservice is alive.
 * @returns {Promise<{online: boolean, data?: Object, error?: string, latencyMs: number}>}
 */
const checkAIHealth = async () => {
  const startTime = Date.now();
  try {
    const res = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 3000,
    });
    return {
      online: res.status === 200,
      status: 'online',
      data: res.data,
      latencyMs: Date.now() - startTime,
      url: AI_SERVICE_URL,
    };
  } catch (error) {
    return {
      online: false,
      status: 'offline',
      error: error.message,
      code: error.code || 'UNREACHABLE',
      latencyMs: Date.now() - startTime,
      url: AI_SERVICE_URL,
    };
  }
};

/**
 * Sends a video file to the Python Football Computer Vision Microservice for analysis.
 * @param {string} videoFilePath - Absolute path to video on disk
 * @param {string} drillType - 'dribbling', 'shooting', or 'ball_control'
 * @param {string} preferredFoot - 'Left' or 'Right'
 * @returns {Promise<Object>} Dynamic AI Analysis Results
 */
const sendVideoToAI = async (videoFilePath, drillType = 'dribbling', preferredFoot = 'Right') => {
  const startTime = Date.now();
  console.log(`📡 [AI Bridge] Sending ${drillType.toUpperCase()} video to Python service at ${AI_SERVICE_URL}...`);

  try {
    let response;

    if (videoFilePath && fs.existsSync(videoFilePath)) {
      const stats = fs.statSync(videoFilePath);
      console.log(`📦 [AI Bridge] Video payload size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

      const formData = new FormData();
      formData.append('video', fs.createReadStream(videoFilePath));
      formData.append('drillType', drillType);
      formData.append('preferredFoot', preferredFoot);

      response = await axios.post(`${AI_SERVICE_URL}/api/ai/analyze`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: AI_PROCESSING_TIMEOUT_MS,
        maxContentLength: 500 * 1024 * 1024,
        maxBodyLength: 500 * 1024 * 1024,
      });
    } else {
      console.log(`ℹ️ [AI Bridge] No local file stream found. Requesting server-side videoPath evaluation.`);
      response = await axios.post(
        `${AI_SERVICE_URL}/api/ai/analyze`,
        {
          videoPath: videoFilePath || '',
          drillType,
          preferredFoot,
        },
        { timeout: AI_PROCESSING_TIMEOUT_MS }
      );
    }

    const durationMs = Date.now() - startTime;
    console.log(`✅ [AI Bridge] AI assessment completed successfully in ${(durationMs / 1000).toFixed(2)}s!`);
    return response.data;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    let failureCategory = 'unavailable';
    let userMessage = '';

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      failureCategory = 'unreachable';
      userMessage = `AI Computer Vision service is offline or unreachable at ${AI_SERVICE_URL}. Please ensure the Python service is running on port 8000 (python app.py).`;
      console.error(`❌ [AI Bridge] Connection refused at ${AI_SERVICE_URL} after ${durationMs}ms`);
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      failureCategory = 'timeout';
      userMessage = `AI Computer Vision processing timed out (${error.message}). The video may be exceptionally long or the host CPU is under heavy load.`;
      console.error(`⏳ [AI Bridge] Request timed out after ${(durationMs / 1000).toFixed(2)}s`);
    } else if (error.response) {
      failureCategory = 'processing_error';
      const serverMsg = error.response.data?.message || error.response.statusText;
      userMessage = `AI Computer Vision processing failed (${error.response.status}): ${serverMsg}`;
      console.error(`⚠️ [AI Bridge] Python microservice returned error ${error.response.status}:`, error.response.data);
    } else {
      userMessage = `AI Computer Vision Service error: ${error.message}.`;
      console.error(`❌ [AI Bridge] Unexpected error: ${error.message}`);
    }

    return {
      success: false,
      status: failureCategory,
      message: userMessage,
      error: error.message,
      errorCode: error.code || null,
      drillType,
      processingTimeMs: durationMs,
      timestamp: new Date().toISOString(),
    };
  }
};

module.exports = {
  sendVideoToAI,
  checkAIHealth,
  AI_SERVICE_URL,
};

