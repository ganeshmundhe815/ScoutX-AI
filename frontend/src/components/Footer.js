import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function Footer({ navigation, onNavigateSection }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleNav = (sectionKey, routeName) => {
    if (onNavigateSection) {
      onNavigateSection(sectionKey);
    } else if (navigation) {
      if (routeName) {
        navigation.navigate(routeName);
      } else {
        navigation.navigate('Landing');
      }
    }
  };

  return (
    <View style={styles.footerContainer}>
      <View style={styles.footerInner}>
        {/* Top Section */}
        <View style={[styles.topRow, isMobile && styles.topRowMobile]}>
          {/* Brand & Mission */}
          <View style={styles.brandBlock}>
            <View style={styles.brand}>
              <View style={styles.logoBadge}>
                <Ionicons name="football" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.brandName}>ScoutX<Text style={styles.brandAccent}>.AI</Text></Text>
            </View>
            <Text style={styles.description}>
              Computer vision-powered football scouting platform built for objective grassroots talent discovery, skill assessment, and player profiling.
            </Text>
            <View style={styles.techPills}>
              <View style={styles.techPill}>
                <Text style={styles.techPillText}>YOLOv8 Detection</Text>
              </View>
              <View style={styles.techPill}>
                <Text style={styles.techPillText}>MediaPipe Pose</Text>
              </View>
              <View style={styles.techPill}>
                <Text style={styles.techPillText}>AIFF / Khelo India Aligned</Text>
              </View>
            </View>
          </View>

          {/* Navigation Links Column */}
          <View style={styles.linksColumn}>
            <Text style={styles.columnTitle}>Platform</Text>
            <TouchableOpacity onPress={() => handleNav('home', 'Landing')} style={styles.linkItem}>
              <Text style={styles.linkText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNav('how-it-works')} style={styles.linkItem}>
              <Text style={styles.linkText}>How It Works</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNav('player-assessment')} style={styles.linkItem}>
              <Text style={styles.linkText}>Player Assessment</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNav('for-coaches')} style={styles.linkItem}>
              <Text style={styles.linkText}>For Coaches & Scouts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNav('about')} style={styles.linkItem}>
              <Text style={styles.linkText}>About Platform</Text>
            </TouchableOpacity>
          </View>

          {/* Access Links Column */}
          <View style={styles.linksColumn}>
            <Text style={styles.columnTitle}>Get Started</Text>
            <TouchableOpacity onPress={() => navigation && navigation.navigate('Login')} style={styles.linkItem}>
              <Text style={styles.linkText}>Athlete & Coach Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation && navigation.navigate('Register')} style={styles.linkItem}>
              <Text style={styles.linkText}>Register New Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation && navigation.navigate('Register', { preselectedRole: 'coach' })}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Register as Scout / Coach</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation && navigation.navigate('Register', { preselectedRole: 'admin' })}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Administrator Portal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subtle Horizontal Divider */}
        <View style={styles.divider} />

        {/* Bottom Row */}
        <View style={[styles.bottomRow, isMobile && styles.bottomRowMobile]}>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} ScoutX-AI Platform. Built for football talent development.
          </Text>
          <Text style={styles.licenseNotice}>
            Autonomous AI Video Analytics Engine • Node.js Express • MongoDB
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: COLORS.darkSection,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBorder,
    width: '100%',
    paddingVertical: SPACING.xxl,
  },
  footerInner: {
    maxWidth: 1240,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 40,
  },
  topRowMobile: {
    flexDirection: 'column',
    gap: 28,
  },
  brandBlock: {
    flex: 2,
    maxWidth: 440,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: COLORS.primaryBorder,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textLightMuted,
    marginBottom: 16,
  },
  techPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techPill: {
    backgroundColor: COLORS.darkSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  techPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLightMuted,
  },
  linksColumn: {
    flex: 1,
    minWidth: 160,
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  linkItem: {
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.textLightMuted,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.darkBorder,
    marginVertical: SPACING.xl,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomRowMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  copyright: {
    fontSize: 12,
    color: COLORS.textLightMuted,
  },
  licenseNotice: {
    fontSize: 12,
    color: COLORS.textLightMuted,
    opacity: 0.7,
  },
});
