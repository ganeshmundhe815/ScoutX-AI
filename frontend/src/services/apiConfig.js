import { Platform } from 'react-native';

/**
 * API Configuration for ScoutX AI Football Mobile & Web App
 * Automatically resolves localhost for Web and LAN Wi-Fi IP for Physical Mobile Devices (Expo Go)
 */

// Host machine Wi-Fi IP for Physical Phone & Emulator connectivity
const LAN_HOST_IP = '192.168.1.79';

// Live Cloud URL (fallback for public deployments and remote testing)
const CLOUD_API_URL = process.env.EXPO_PUBLIC_CLOUD_API_URL || 'https://scoutx-backend-ub59.onrender.com/api';
const USE_CLOUD = process.env.EXPO_PUBLIC_USE_CLOUD === 'true';

export const normalizeApiUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'https://scoutx-backend-ub59.onrender.com/api';
  }

  let clean = rawUrl.trim();
  if (!clean) {
    return 'https://scoutx-backend-ub59.onrender.com/api';
  }

  // Strip trailing slashes
  clean = clean.replace(/\/+$/, '');

  // Extract optional protocol
  let proto = '';
  let hostAndPath = clean;
  const protoMatch = clean.match(/^(https?:\/\/)/i);
  if (protoMatch) {
    proto = protoMatch[1].toLowerCase();
    hostAndPath = clean.slice(proto.length);
  }

  // Split host and path
  let [hostPart, ...pathParts] = hostAndPath.split('/');
  let pathPart = pathParts.join('/');

  const isLocalHost =
    hostPart.startsWith('localhost') ||
    hostPart.startsWith('127.0.0.1') ||
    /^192\.168\.\d{1,3}\.\d{1,3}/.test(hostPart) ||
    /^10\.\d{1,3}\.\d{1,3}/.test(hostPart) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}/.test(hostPart);

  // If host has no dots and no port, and is not local, it is a bare Render service name (e.g. 'scoutx-backend-ub59')
  if (!hostPart.includes('.') && !hostPart.includes(':') && !isLocalHost) {
    hostPart = `${hostPart}.onrender.com`;
  }

  // Determine protocol:
  // Local development supports http://.
  // ALL public / cloud domains must use https:// to strictly prevent mixed-content blocks!
  if (isLocalHost) {
    proto = proto || 'http://';
  } else {
    proto = 'https://';
  }

  // Reconstruct URL with /api path
  let normalized = `${proto}${hostPart}`;
  if (pathPart) {
    pathPart = pathPart.replace(/^\/+|\/+$/g, '');
    if (pathPart === 'api' || pathPart.endsWith('/api')) {
      normalized = `${normalized}/${pathPart}`;
    } else {
      normalized = `${normalized}/${pathPart}/api`;
    }
  } else {
    normalized = `${normalized}/api`;
  }

  // Final normalization: avoid duplicate slashes in path and duplicate /api/api
  normalized = normalized.replace(/([^:])\/\/+/g, '$1/');
  normalized = normalized.replace(/\/api\/api$/i, '/api');

  return normalized;
};

const isLanHostname = (hostname) => {
  if (!hostname) return false;
  if (hostname.endsWith('.local')) return true;
  // Match standard private IPv4 ranges: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
};

const getApiBaseUrl = () => {
  // 1. Explicit environment variable override takes absolute precedence
  if (process.env.EXPO_PUBLIC_API_URL) {
    return normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
  }

  // 2. Explicit cloud mode toggle
  if (USE_CLOUD) {
    return normalizeApiUrl(CLOUD_API_URL);
  }

  // 3. Web Browser environment
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    // Local developer machine
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:5000/api`;
    }
    // Local LAN Wi-Fi testing (e.g. phone hitting laptop's Expo web server)
    if (isLanHostname(hostname)) {
      return `http://${hostname}:5000/api`;
    }
    // Online Public Domain (e.g. Vercel, Render, Netlify, custom domain)
    // Never route public web traffic to laptop localhost or private LAN IP
    return normalizeApiUrl(CLOUD_API_URL);
  }

  // 4. Physical Mobile devices on local Wi-Fi (Expo Go)
  return `http://${LAN_HOST_IP}:5000/api`;
};

export const BASE_API_URL = getApiBaseUrl();

/**
 * Retrieves the currently persisted authentication token from local storage (Web)
 * @returns {string|null} JWT token if present, else null
 */
export const getStoredAuthToken = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      const directToken = localStorage.getItem('scoutx_token');
      if (directToken) return directToken;
      const sessionStr = localStorage.getItem('scoutx_user_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session && session.userToken) return session.userToken;
      }
    } catch (e) {
      console.warn('[getStoredAuthToken Error]:', e);
    }
  }
  return null;
};

/**
 * Builds HTTP headers including Authorization Bearer token when available
 * @param {string|null} explicitToken - Optional explicit token to prioritize
 * @param {Object} extraHeaders - Any additional headers (e.g. Content-Type)
 * @returns {Object} Headers object with Authorization header attached
 */
export const getAuthHeaders = (explicitToken = null, extraHeaders = {}) => {
  const token = explicitToken || getStoredAuthToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export default {
  BASE_API_URL,
  AUTH: {
    REGISTER: `${BASE_API_URL}/auth/register`,
    LOGIN: `${BASE_API_URL}/auth/login`,
    PROFILE: `${BASE_API_URL}/auth/profile`,
    GOOGLE: `${BASE_API_URL}/auth/google`,
    APPLE: `${BASE_API_URL}/auth/apple`,
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

