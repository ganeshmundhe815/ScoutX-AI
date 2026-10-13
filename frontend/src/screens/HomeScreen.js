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
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

// Import Role-Specific Views
import PlayerDashboardView from './player/PlayerDashboardView';
import CoachDashboardView from './coach/CoachDashboardView';
import AdminDashboardView from './admin/AdminDashboardView';

const ER_ENTITIES_SPEC = [
  {
    name: 'USER',
    pk: 'PK user_id',
    fk: '—',
    attrs: 'name • email • password_hash • role',
    rel: '1 : 0..1 (profile) → ATHLETE / COACH',
    color: COLORS.primary,
  },
  {
    name: 'ATHLETE',
    pk: 'PK athlete_id',
    fk: 'FK user_id',
    attrs: 'age • playing_position • city',
    rel: '1 : N (has) → ASSESSMENT | 1 : N → SHORTLIST',
    color: '#0284C7',
  },
  {
    name: 'COACH',
    pk: 'PK coach_id',
    fk: 'FK user_id',
    attrs: 'coach_name / profile • clubOrAcademy • licenseLevel',
    rel: '1 : N (creates) → SHORTLIST',
    color: '#7C3AED',
  },
  {
    name: 'SHORTLIST',
    pk: 'PK shortlist_id',
    fk: 'FK coach_id, FK athlete_id',
    attrs: 'note • created_at',
    rel: 'Links COACH to shortlisted ATHLETE',
    color: '#D97706',
  },
  {
    name: 'ASSESSMENT',
    pk: 'PK assessment_id',
    fk: 'FK athlete_id',
    attrs: 'drill_type • video_url • status',
    rel: '1 : N (contains) → METRIC | 1 : 1 (produces) → SCORE',
    color: '#DB2777',
  },
  {
    name: 'METRIC',
    pk: 'PK metric_id',
    fk: 'FK assessment_id',
    attrs: 'metric_name • value',
    rel: 'Belongs to ASSESSMENT (1:N)',
    color: '#0D9488',
  },
  {
    name: 'SCORE',
    pk: 'PK score_id',
    fk: 'FK assessment_id',
    attrs: 'technique • consistency • accuracy • endurance • overall',
    rel: 'Produced by ASSESSMENT (1:1)',
    color: COLORS.primary,
  },
];

const DFD_PROCESSES_SPEC = [
  {
    code: 'P1 — CLIENT APP',
    tech: 'Expo / React Native / Web',
    desc: 'Login • Record • Upload • View results',
  },
  {
    code: 'P2 — BACKEND API & AUTH',
    tech: 'Node.js / Express (Port 5000)',
    desc: 'JWT • Role access • Business logic • Routes to D1 & D2',
  },
  {
    code: 'P3 — FOOTBALL AI ANALYSIS',
    tech: 'Python / Flask • OpenCV • MediaPipe • YOLO (Port 8000)',
    desc: 'Dribbling • Shooting • Ball control • Keypoints & motion metrics',
  },
  {
    code: 'P4 — SCORING & REPORTS',
    tech: 'ScoringReportService Engine',
    desc: 'Calculate METRICs and SCOREs (technique, consistency, accuracy, endurance, overall) • Save to D2',
  },
  {
    code: 'P5 — ROLE-BASED FEATURES',
    tech: 'Role-Segregated Portals',
    desc: 'Player: results & history | Coach: discover & shortlist | Admin: manage platform',
  },
];

export default function HomeScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const [archModalVisible, setArchModalVisible] = useState(false);

  // Read session from route params or fallback to storage
  const [session, setSession] = useState(() => {
    let initial = route.params || {};
    if (
      (!initial.userToken || !initial.userRole) &&
      Platform.OS === 'web' &&
      typeof localStorage !== 'undefined'
    ) {
      try {
        const saved = JSON.parse(localStorage.getItem('scoutx_user_session') || '{}');
        if (saved && saved.userRole) {
          initial = { ...saved, ...initial };
        }
      } catch (e) {}
    }
    return {
      userRole: initial.userRole || 'player',
      userId: initial.userId || 'USR-100101',
      userName:
        initial.userName ||
        (initial.userRole === 'coach'
          ? 'Coach Ranjan Patil'
          : initial.userRole === 'admin'
          ? 'ScoutX Admin'
          : 'Sunil Chhetri Jr'),
      userEmail:
        initial.userEmail ||
        (initial.userRole === 'coach'
          ? 'coach@scoutx.com'
          : initial.userRole === 'admin'
          ? 'admin@scoutx.com'
          : 'player@scoutx.com'),
      userToken: initial.userToken,
      userLocation: initial.userLocation || {
        state: 'Karnataka',
        district: 'Bengaluru',
        city: 'Bengaluru',
      },
      playerProfile: initial.playerProfile || null,
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
        localStorage.removeItem('scoutx_token');
      } catch (e) {}
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('Are you sure you want to sign out from ScoutX-AI?')) {
          performSignOut();
        }
      } else {
        performSignOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out from ScoutX-AI?', [
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Application Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.brand}
            onPress={() => navigation.navigate('Landing')}
            activeOpacity={0.8}
          >
            <View style={styles.logoBadge}>
              <Ionicons name="football" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandName}>ScoutX<Text style={styles.brandAccent}>.AI</Text></Text>
              <Text style={styles.brandRoleSubtitle}>
                {currentRole === 'coach'
                  ? 'COACH & SCOUT PORTAL'
                  : currentRole === 'admin'
                  ? 'ADMINISTRATOR PORTAL'
                  : 'ATHLETE PERFORMANCE PORTAL'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          {/* Public Home Link */}
          <TouchableOpacity
            style={styles.headerLinkButton}
            onPress={() => navigation.navigate('Landing')}
          >
            <Ionicons name="globe-outline" size={15} color={COLORS.textSecondary} style={{ marginRight: 5 }} />
            {isDesktop && <Text style={styles.headerLinkText}>Public Home</Text>}
          </TouchableOpacity>

          {/* Architecture & Model Spec Pill */}
          <TouchableOpacity
            style={styles.archButton}
            onPress={() => setArchModalVisible(true)}
          >
            <Ionicons name="layers-outline" size={15} color={COLORS.primary} style={{ marginRight: 5 }} />
            {isDesktop && <Text style={styles.archButtonText}>Architecture & Models</Text>}
          </TouchableOpacity>

          {/* Messages Link */}
          <TouchableOpacity
            style={styles.headerLinkButton}
            onPress={() => navigation.navigate('Messages', { userRole: currentRole, userName: session.userName })}
          >
            <Ionicons name="chatbubbles-outline" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* User Badge */}
          <View style={styles.userBadge}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {(session.userName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            {isDesktop && (
              <View>
                <Text style={styles.userName}>{session.userName || 'User'}</Text>
                <Text style={styles.userRoleTag}>{currentRole.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            title="Sign Out"
          >
            <Ionicons name="log-out-outline" size={17} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Dashboard Routing */}
      <View style={styles.dashboardContainer}>
        {currentRole === 'player' && (
          <PlayerDashboardView
            userName={session.userName}
            userId={session.userId}
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
            userId={session.userId}
            userLocation={session.userLocation}
            userToken={session.userToken}
            navigation={navigation}
          />
        )}

        {currentRole === 'admin' && (
          <AdminDashboardView
            userName={session.userName}
            userId={session.userId}
            userToken={session.userToken}
            navigation={navigation}
          />
        )}
      </View>

      {/* Academic / Technical Architecture Modal (ER Diagram & DFD processes) */}
      <Modal
        visible={archModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setArchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>System Architecture & Entity Specification</Text>
                <Text style={styles.modalSubtitle}>Aligned with Khelo India & AIFF Grassroots Data Model</Text>
              </View>
              <TouchableOpacity onPress={() => setArchModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>7 Core ER Entities</Text>
              <View style={styles.erGrid}>
                {ER_ENTITIES_SPEC.map((e) => (
                  <View key={e.name} style={styles.erCard}>
                    <View style={[styles.erPill, { backgroundColor: COLORS.primaryLight }]}>
                      <Text style={[styles.erPillText, { color: COLORS.primaryDark }]}>{e.name}</Text>
                    </View>
                    <Text style={styles.erKeys}>{e.pk} {e.fk !== '—' ? `• ${e.fk}` : ''}</Text>
                    <Text style={styles.erAttrs}>{e.attrs}</Text>
                    <Text style={styles.erRel}>{e.rel}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.modalSectionTitle, { marginTop: 24 }]}>5 DFD Workflow Processes</Text>
              <View style={styles.dfdList}>
                {DFD_PROCESSES_SPEC.map((p) => (
                  <View key={p.code} style={styles.dfdRow}>
                    <Text style={styles.dfdCode}>{p.code}</Text>
                    <Text style={styles.dfdTech}>{p.tech}</Text>
                    <Text style={styles.dfdDesc}>{p.desc}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  brandRoleSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  headerLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  archButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.primaryLight,
  },
  archButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    gap: 6,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 14,
  },
  userRoleTag: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  signOutButton: {
    padding: 7,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    marginLeft: 4,
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '90%',
    maxWidth: 820,
    width: '100%',
    marginHorizontal: 'auto',
    ...SHADOWS.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 520,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  erGrid: {
    gap: 10,
  },
  erCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  erPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginBottom: 6,
  },
  erPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  erKeys: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  erAttrs: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  erRel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  dfdList: {
    gap: 10,
  },
  dfdRow: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  dfdCode: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dfdTech: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '600',
    marginVertical: 2,
  },
  dfdDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
