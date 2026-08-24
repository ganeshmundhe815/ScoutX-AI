import { Platform } from 'react-native';

/**
 * API Configuration for ScoutX AI Football Mobile & Web App
 * Automatically resolves localhost for Web and LAN Wi-Fi IP for Physical Mobile Devices (Expo Go)
 */

// Host machine Wi-Fi IP for Physical Phone & Emulator connectivity
const LAN_HOST_IP = '192.168.1.79';

// Live Cloud URL (optional fallback for remote testing over 4G/5G)
const CLOUD_API_URL = 'https://scoutx-backend.onrender.com/api';
const USE_CLOUD = false;

const getApiBaseUrl = () => {
  if (USE_CLOUD) {
    return CLOUD_API_URL;
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  // Mobile devices (Android / iOS) connect via LAN IP
  return `http://${LAN_HOST_IP}:5000/api`;
};

export const BASE_API_URL = getApiBaseUrl();

export default {
  BASE_API_URL,
  AUTH: {
    REGISTER: `${BASE_API_URL}/auth/register`,
    LOGIN: `${BASE_API_URL}/auth/login`,
    PROFILE: `${BASE_API_URL}/auth/profile`,
  },
  PLAYERS: {
    PROFILE: `${BASE_API_URL}/players/profile`,
    STATS: `${BASE_API_URL}/players/stats`,
    DETAIL: (id) => `${BASE_API_URL}/players/${id}`,
  },
  ASSESSMENTS: {
    ANALYZE: `${BASE_API_URL}/assessments/analyze`,
    HISTORY: `${BASE_API_URL}/assessments`,
  },
  SCOUTS: {
    PLAYERS: `${BASE_API_URL}/scouts/players`,
    SHORTLIST: `${BASE_API_URL}/scouts/shortlist`,
    LEADERBOARD: `${BASE_API_URL}/scouts/leaderboard`,
  },
  MESSAGES: {
    SEND: `${BASE_API_URL}/messages`,
    CONVERSATIONS: `${BASE_API_URL}/messages/conversations`,
    HISTORY: (userId) => `${BASE_API_URL}/messages/${userId}`,
  },
  ADMIN: {
    STATS: `${BASE_API_URL}/admin/stats`,
    USERS: `${BASE_API_URL}/admin/users`,
  },
};
