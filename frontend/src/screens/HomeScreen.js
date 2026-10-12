import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../services/apiConfig';

// Import Role-Specific Views
import PlayerDashboardView from './player/PlayerDashboardView';
import CoachDashboardView from './coach/CoachDashboardView';
import AdminDashboardView from './admin/AdminDashboardView';

export default function HomeScreen({ route, navigation }) {
  // Read session from route params or fallback to storage
  const [session, setSession] = useState(() => {
    let initial = route.params || {};
    if ((!initial.userToken || !initial.userRole) && Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('scoutx_user_session') || '{}');
        if (saved && saved.userRole) {
          initial = { ...saved, ...initial };
        }
      } catch (e) {}
    }
    return {
      userRole: initial.userRole || 'player',
      userName: initial.userName || (initial.userRole === 'coach' ? 'Coach Ranjan Patil' : initial.userRole === 'admin' ? 'ScoutX Admin' : 'Sunil Chhetri Jr'),
      userEmail: initial.userEmail || (initial.userRole === 'coach' ? 'coach@scoutx.com' : initial.userRole === 'admin' ? 'admin@scoutx.com' : 'player@scoutx.com'),
      userToken: initial.userToken,
      userLocation: initial.userLocation || { state: 'Karnataka', district: 'Bengaluru', city: 'Bengaluru' },
      playerProfile: initial.playerProfile || {
        playerId: 'FB-882104',
        position: 'Striker',
        preferredFoot: 'Right',
        clubOrTeam: 'Bengaluru Youth FC',
        overallScore: 89.5,
        dribblingScore: 91.0,
        shootingScore: 92.5,
        ballControlScore: 86.0,
        shotAccuracy: 88.0,
        estimatedPower: 85.0,
        nationalPercentile: 96.4,
        assessmentCount: 4,
        age: 18,
        heightCm: 178,
        weightKg: 72,
      },
    };
  });

  // Sync session on mount
  useEffect(() => {
    if (route.params) {
      setSession((prev) => ({ ...prev, ...route.params }));
    }
  }, [route.params]);

  const performSignOut = () => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('scoutx_user_session');
      } catch (e) {}
    }
    setSession({
      userRole: 'player',
      userName: '',
      userEmail: '',
      userToken: null,
      userLocation: null,
      playerProfile: null,
    });
    try {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (e) {
      navigation.replace('Login');
    }
  };

  // Sign Out Handler: Purges session and redirects to Login
  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('Are you sure you want to sign out from ScoutX AI?')) {
          performSignOut();
        }
      } else {
        performSignOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out from ScoutX AI?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: performSignOut,
        },
      ]);
    }
  };

  const handleProfileUpdate = (updatedProfile, updatedName) => {
    setSession((prev) => {
      const next = {
        ...prev,
        userName: updatedName || prev.userName,
        playerProfile: { ...prev.playerProfile, ...updatedProfile },
      };
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('scoutx_user_session', JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  };

  const currentRole = session.userRole?.toLowerCase() || 'player';

  const roleColor =
    currentRole === 'admin'
      ? '#EC4899'
      : currentRole === 'coach'
      ? '#38BDF8'
      : '#10B981';

  const roleIcon =
    currentRole === 'admin'
      ? 'settings'
      : currentRole === 'coach'
      ? 'shield-checkmark'
      : 'football';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* ======================================================== */}
      {/* GLOBAL TOP NAVIGATION & ROLE BADGE HEADER */}
      {/* ======================================================== */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Ionicons name="football" size={24} color="#10B981" />
          <Text style={styles.brandTitle}>ScoutX AI</Text>
        </View>

        <View style={styles.topActionsRow}>
          {/* Verified Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20`, borderColor: `${roleColor}50` }]}>
            <Ionicons name={roleIcon} size={13} color={roleColor} />
            <Text style={[styles.roleBadgeText, { color: roleColor }]}>
              {currentRole.toUpperCase()}
            </Text>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ======================================================== */}
      {/* ROLE-SPECIFIC APPLICATION EXPERIENCE */}
      {/* ======================================================== */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentRole === 'player' && (
          <PlayerDashboardView
            userName={session.userName}
            userLocation={session.userLocation}
            userToken={session.userToken}
            profile={session.playerProfile}
            onProfileUpdate={handleProfileUpdate}
            navigation={navigation}
          />
        )}

        {currentRole === 'coach' && (
          <CoachDashboardView
            userName={session.userName}
            userLocation={session.userLocation}
            userToken={session.userToken}
            navigation={navigation}
          />
        )}

        {currentRole === 'admin' && (
          <AdminDashboardView
            userName={session.userName}
            userToken={session.userToken}
            navigation={navigation}
          />
        )}

        {/* Global Platform Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ScoutX AI • Democratizing Football Talent Assessment • MediaPipe + YOLO
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  footer: {
    marginTop: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
  },
});
