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
  // 1. Custom explicit Expo Public API URL if set in environment
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // 2. Web Browser: dynamically resolve the host so LAN devices hitting http://<HOST_IP>:8081 connect to http://<HOST_IP>:5000
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }
  // 3. Mobile devices (Android / iOS) connect via LAN IP
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
    DEMO_SAMPLE: `${BASE_API_URL}/assessments/demo-sample`,
  },
  SCOUTS: {
    PLAYERS: `${BASE_API_URL}/scouts/players`,
    SHORTLIST: `${BASE_API_URL}/scouts/shortlist`,
    SHORTLIST_REMOVE: (playerId) => `${BASE_API_URL}/scouts/shortlist/${playerId}`,
    LEADERBOARD: `${BASE_API_URL}/scouts/leaderboard`,
    BENCHMARKS: `${BASE_API_URL}/scouts/benchmarks`,
    BENCHMARK_DETAIL: (id) => `${BASE_API_URL}/scouts/benchmarks/${id}`,
  },
  MESSAGES: {
    SEND: `${BASE_API_URL}/messages`,
    CONVERSATIONS: `${BASE_API_URL}/messages/conversations`,
    HISTORY: (userId) => `${BASE_API_URL}/messages/${userId}`,
  },
  ADMIN: {
    STATS: `${BASE_API_URL}/admin/stats`,
    USERS: `${BASE_API_URL}/admin/users`,
    USER_STATUS: (userId) => `${BASE_API_URL}/admin/users/${userId}/status`,
    DELETE_USER: (userId) => `${BASE_API_URL}/admin/users/${userId}`,
    PLAYERS: `${BASE_API_URL}/admin/players`,
    COACHES: `${BASE_API_URL}/admin/coaches`,
    ASSESSMENTS: `${BASE_API_URL}/admin/assessments`,
  },
};

