/**
 * ScoutX-AI Professional Design System & Theme
 * 
 * Clean, athletic sports technology design inspired by modern sports analytics platforms
 * (StatsBomb, Wyscout, Opta) and professional football club websites.
 * 
 * Color Palette:
 * - Main background: #FFFFFF / #F8FAFC
 * - Primary text: #0F172A (dark charcoal / near-black)
 * - Secondary text: #475569 (medium slate grey)
 * - Primary accent: #15803D (muted football green)
 * - Subtle borders: #E2E8F0
 * - Dark sections: #0F172A (charcoal)
 */

export const COLORS = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  darkSection: '#0F172A',
  darkSurface: '#1E293B',
  darkBorder: '#334155',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textLight: '#F8FAFC',
  textLightMuted: '#94A3B8',

  // Primary Accent: Muted Football Green
  primary: '#15803D',
  primaryDark: '#166534',
  primaryLight: '#DCFCE7',
  primaryBorder: '#86EFAC',

  // Secondary Accents
  accentBlue: '#0284C7',
  accentAmber: '#D97706',
  accentRed: '#DC2626',
  accentSuccess: '#15803D',

  // Structural & Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  hero: 64,
};

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

export default {
  COLORS,
  SPACING,
  RADIUS,
  SHADOWS,
};
