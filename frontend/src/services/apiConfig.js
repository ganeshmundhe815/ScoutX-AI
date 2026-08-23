/**
 * API Configuration for ScoutX AI Mobile App
 * Automatically switch between Localhost and Free Cloud Server
 */

// Option 1: Local Development URL
const LOCAL_API_URL = 'http://127.0.0.1:5000/api';

// Option 2: Live Cloud URL (Set this to your Render.com or Tunnel URL when presenting)
const CLOUD_API_URL = 'https://scoutx-backend.onrender.com/api';

// Toggle this: set to true when presenting or testing on mobile over 4G/5G
const USE_CLOUD = false;

export const BASE_API_URL = USE_CLOUD ? CLOUD_API_URL : LOCAL_API_URL;

export default {
  BASE_API_URL,
  AUTH: {
    REGISTER: `${BASE_API_URL}/auth/register`,
    LOGIN: `${BASE_API_URL}/auth/login`,
    PROFILE: `${BASE_API_URL}/auth/profile`,
  },
  ATHLETES: {
    DASHBOARD: `${BASE_API_URL}/athletes/dashboard`,
    PROFILE: `${BASE_API_URL}/athletes/profile`,
  },
  ASSESSMENTS: {
    ANALYZE: `${BASE_API_URL}/assessments/analyze`,
  },
  SCOUTS: {
    LEADERBOARD: `${BASE_API_URL}/scouts/leaderboard`,
  },
};
