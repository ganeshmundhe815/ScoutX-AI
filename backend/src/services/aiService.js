const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Sends a video file to the Python Football Computer Vision Microservice for analysis.
 * @param {string} videoFilePath - Absolute path to video on disk
 * @param {string} drillType - 'dribbling', 'shooting', or 'ball_control'
 * @returns {Promise<Object>} Dynamic AI Analysis Results
 */
const sendVideoToAI = async (videoFilePath, drillType = 'dribbling') => {
  try {
    console.log(`📡 [AI Bridge] Sending ${drillType.toUpperCase()} video to Python service at ${AI_SERVICE_URL}...`);

    let response;

    if (videoFilePath && fs.existsSync(videoFilePath)) {
      const formData = new FormData();
      formData.append('video', fs.createReadStream(videoFilePath));
      formData.append('drillType', drillType);

      response = await axios.post(`${AI_SERVICE_URL}/api/ai/analyze`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30-second timeout for video processing
      });
    } else {
      response = await axios.post(
        `${AI_SERVICE_URL}/api/ai/analyze`,
        {
          videoPath: videoFilePath || '',
          drillType,
        },
        { timeout: 30000 }
      );
    }

    console.log(`✅ [AI Bridge] Received dynamic AI assessment metrics from Python CV Engine!`);
    return response.data;
  } catch (error) {
    console.error(`❌ [AI Bridge]: Python CV Microservice unavailable at ${AI_SERVICE_URL} (${error.message})`);
    return {
      success: false,
      status: 'unavailable',
      message: `AI Computer Vision Service is unavailable (${error.message}). Real video assessment could not be processed. Please ensure the Python AI microservice is running on port 8000.`,
      error: error.message,
      drillType,
      timestamp: new Date().toISOString(),
    };
  }
};

module.exports = {
  sendVideoToAI,
};
