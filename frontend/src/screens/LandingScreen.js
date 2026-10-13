import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FootballImage from '../components/FootballImage';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { FOOTBALL_MEDIA } from '../constants/footballMedia';

export default function LandingScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isTablet = width >= 640 && width < 900;
  const scrollViewRef = useRef(null);

  // Section position references for smooth scrolling
  const [sectionOffsets, setSectionOffsets] = useState({
    hero: 0,
    howItWorks: 600,
    features: 1100,
    coaches: 1700,
    about: 2300,
  });

  // Current session if previously signed in
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('scoutx_user_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.userName || parsed.name)) {
            setSessionUser(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const scrollToSection = (sectionKey) => {
    const offset = sectionOffsets[sectionKey] || 0;
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: Math.max(0, offset - 70), animated: true });
    }
  };

  const handleLayoutSection = (key, event) => {
    const layout = event.nativeEvent.layout;
    setSectionOffsets((prev) => ({
      ...prev,
      [key]: layout.y,
    }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Professional Navigation Bar */}
      <Navbar
        navigation={navigation}
        user={sessionUser}
        onNavigateSection={(sectionKey) => {
          if (sectionKey === 'home') scrollToSection('hero');
          else if (sectionKey === 'how-it-works') scrollToSection('howItWorks');
          else if (sectionKey === 'player-assessment') scrollToSection('features');
          else if (sectionKey === 'for-coaches') scrollToSection('coaches');
          else if (sectionKey === 'about') scrollToSection('about');
        }}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================
            HERO SECTION
           ======================================================== */}
        <View
          style={[styles.heroSection, isDesktop && styles.heroSectionDesktop]}
          onLayout={(e) => handleLayoutSection('hero', e)}
        >
          <View style={styles.heroContentInner}>
            {/* Left Content Area */}
            <View style={[styles.heroTextColumn, isDesktop && { maxWidth: '52%' }]}>
              {/* Category Pill */}
              <View style={styles.heroCategoryPill}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.heroCategoryText}>AIFF / Grassroots Talent Analytics</Text>
              </View>

              {/* Headline */}
              <Text style={styles.heroHeadline}>
                Discover Football Talent.{'\n'}
                <Text style={styles.heroHeadlineAccent}>Measure Performance.</Text>
              </Text>

              {/* Subtitle / Description */}
              <Text style={styles.heroDescription}>
                ScoutX-AI helps players understand their performance and helps coaches discover football talent through video-based assessment and objective performance insights.
              </Text>

              {/* Action Buttons */}
              <View style={styles.heroActionGroup}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryActionText}>Get Started</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={() => scrollToSection('howItWorks')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryActionText}>Explore How It Works</Text>
                  <Ionicons name="chevron-down" size={16} color={COLORS.textPrimary} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>

              {/* Restrained Metric Highlights */}
              <View style={styles.heroStatsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>100%</Text>
                  <Text style={styles.statLabel}>Objective Video AI</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>3 Drills</Text>
                  <Text style={styles.statLabel}>Dribble, Shoot, Control</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>Verified</Text>
                  <Text style={styles.statLabel}>Coach Scout Reports</Text>
                </View>
              </View>
            </View>

            {/* Right Football Photography Card */}
            <View style={[styles.heroImageColumn, isDesktop && { width: '45%' }]}>
              <View style={styles.heroImageCard}>
                <FootballImage
                  source={FOOTBALL_MEDIA.hero}
                  style={styles.heroImage}
                  title="Football Pitch Assessment"
                  icon="football-outline"
                />
                {/* Floating Metric Badge */}
                <View style={styles.heroFloatingBadge}>
                  <View style={styles.heroBadgeIcon}>
                    <Ionicons name="analytics" size={18} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.heroBadgeTitle}>Striker Shooting Velocity</Text>
                    <Text style={styles.heroBadgeSubtitle}>92.5% On-Target Accuracy • 88 km/h</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================
            HOW IT WORKS SECTION
           ======================================================== */}
        <View
          style={styles.sectionLight}
          onLayout={(e) => handleLayoutSection('howItWorks', e)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionCategory}>EVALUATION WORKFLOW</Text>
            <Text style={styles.sectionTitle}>How ScoutX-AI Works</Text>
            <Text style={styles.sectionSubtitle}>
              From mobile phone video recording on a local pitch to comprehensive analytics accessible by professional coaches.
            </Text>
          </View>

          <View style={[styles.stepsGrid, isDesktop && styles.stepsGridDesktop]}>
            {/* Step 1 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>01</Text>
              </View>
              <View style={styles.stepIconWrapper}>
                <Ionicons name="videocam-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.stepHeading}>Record or Upload</Text>
              <Text style={styles.stepDescription}>
                The player records a football drill on any standard smartphone camera or uploads an existing training video.
              </Text>
            </View>

            {/* Step 2 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>02</Text>
              </View>
              <View style={styles.stepIconWrapper}>
                <Ionicons name="hardware-chip-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.stepHeading}>AI Performance Analysis</Text>
              <Text style={styles.stepDescription}>
                The system analyzes supported movements, body biomechanics, and football-related metrics using YOLOv8 & MediaPipe.
              </Text>
            </View>

            {/* Step 3 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>03</Text>
              </View>
              <View style={styles.stepIconWrapper}>
                <Ionicons name="stats-chart-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.stepHeading}>View Your Results</Text>
              <Text style={styles.stepDescription}>
                The player views objective scores across technique, consistency, accuracy, and detailed historical progression.
              </Text>
            </View>

            {/* Step 4 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>04</Text>
              </View>
              <View style={styles.stepIconWrapper}>
                <Ionicons name="search-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.stepHeading}>Discover Talent</Text>
              <Text style={styles.stepDescription}>
                Coaches and scouts explore player profiles, filter candidates by playing position, and review verified performance reports.
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================
            CORE FEATURES SECTION
           ======================================================== */}
        <View
          style={styles.sectionNeutral}
          onLayout={(e) => handleLayoutSection('features', e)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionCategory}>SUPPORTED CAPABILITIES</Text>
            <Text style={styles.sectionTitle}>Operational Football Metrics</Text>
            <Text style={styles.sectionSubtitle}>
              Measurable physical and technical attributes extracted directly from football training footage.
            </Text>
          </View>

          <View style={[styles.featuresGrid, isDesktop && styles.featuresGridDesktop]}>
            {/* Feature 1 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconBadge}>
                <Ionicons name="film-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>Football Video Assessment</Text>
              <Text style={styles.featureText}>
                Accepts MP4 video uploads of standard drill setups. Performs frame-by-frame player tracking and automated drill boundary recognition.
              </Text>
            </View>

            {/* Feature 2 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconBadge}>
                <Ionicons name="git-commit-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>Dribbling Analysis</Text>
              <Text style={styles.featureText}>
                Measures cone-weaving cadence, change-of-direction velocity, touch frequency, and lateral balance retention.
              </Text>
            </View>

            {/* Feature 3 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconBadge}>
                <Ionicons name="locate-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>Shooting Analysis</Text>
              <Text style={styles.featureText}>
                Tracks striking technique, back-lift mechanics, follow-through completion, on-target percentage, and estimated shot speed.
              </Text>
            </View>

            {/* Feature 4 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconBadge}>
                <Ionicons name="football-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>Ball Control Assessment</Text>
              <Text style={styles.featureText}>
                Evaluates first-touch cushioning, rebound distance index, juggle consistency, and body orientation under pressure.
              </Text>
            </View>

            {/* Feature 5 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconBadge}>
                <Ionicons name="document-text-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>Player Performance Reports</Text>
              <Text style={styles.featureText}>
                Combines technique, consistency, accuracy, and stamina into a verified 0–100 score and comparative percentile breakdown.
              </Text>
            </View>

            {/* Feature 6 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconBadge}>
                <Ionicons name="people-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>Player Discovery for Coaches</Text>
              <Text style={styles.featureText}>
                Enables certified scouts to filter grassroots athletes by position, region, and score benchmarks, with shortlisting tools.
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================
            FOR COACHES & SCOUTS SECTION
           ======================================================== */}
        <View
          style={styles.coachSection}
          onLayout={(e) => handleLayoutSection('coaches', e)}
        >
          <View style={[styles.coachInner, isDesktop && styles.coachInnerDesktop]}>
            <View style={[styles.coachTextColumn, isDesktop && { maxWidth: '52%' }]}>
              <View style={styles.coachBadge}>
                <Ionicons name="briefcase-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.coachBadgeText}>COACH & SCOUT NETWORK</Text>
              </View>

              <Text style={styles.coachHeadline}>Find Talent Beyond the Touchline.</Text>

              <Text style={styles.coachDescription}>
                Grassroots football talent is often separated by geography and resources. ScoutX-AI allows youth academies, club scouts, and coaches to review standardized video performance reports, inspect technical execution scores, and shortlist promising athletes directly from their device.
              </Text>

              <View style={styles.coachHighlights}>
                <View style={styles.coachHighlightRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primaryBorder} style={{ marginRight: 10 }} />
                  <Text style={styles.coachHighlightText}>Standardized 4-pillar scores: Technique, Consistency, Accuracy, Endurance</Text>
                </View>
                <View style={styles.coachHighlightRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primaryBorder} style={{ marginRight: 10 }} />
                  <Text style={styles.coachHighlightText}>Position-specific filtering (Strikers, Wingers, Midfielders, Defenders)</Text>
                </View>
                <View style={styles.coachHighlightRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primaryBorder} style={{ marginRight: 10 }} />
                  <Text style={styles.coachHighlightText}>Direct talent shortlisting and in-app athlete messaging</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.coachButton}
                onPress={() => navigation.navigate('Register', { preselectedRole: 'coach' })}
                activeOpacity={0.85}
              >
                <Text style={styles.coachButtonText}>Join as a Coach</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>

            <View style={[styles.coachImageColumn, isDesktop && { width: '42%' }]}>
              <View style={styles.coachImageWrapper}>
                <FootballImage
                  source={FOOTBALL_MEDIA.coachTouchline}
                  style={styles.coachImage}
                  title="Coach Pitch-side Assessment"
                  icon="clipboard-outline"
                />
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================
            ABOUT PLATFORM SECTION
           ======================================================== */}
        <View
          style={styles.sectionLight}
          onLayout={(e) => handleLayoutSection('about', e)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionCategory}>PLATFORM PURPOSE</Text>
            <Text style={styles.sectionTitle}>Democratizing Football Recruitment</Text>
            <Text style={styles.sectionSubtitle}>
              Bridging the gap between aspiring grassroots athletes and professional football opportunities.
            </Text>
          </View>

          <View style={[styles.aboutGrid, isDesktop && styles.aboutGridDesktop]}>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutCardTitle}>Grassroots Access</Text>
              <Text style={styles.aboutCardText}>
                Talented players in remote districts often lack access to licensed scouts. ScoutX-AI enables any athlete with a football and a phone camera to establish an objective record of their skill.
              </Text>
            </View>

            <View style={styles.aboutCard}>
              <Text style={styles.aboutCardTitle}>Objective Evidence</Text>
              <Text style={styles.aboutCardText}>
                Traditional scouting relies heavily on subjective impressions during short weekend tournaments. Video-based computer vision measures kinematics, execution speed, and consistency without bias.
              </Text>
            </View>

            <View style={styles.aboutCard}>
              <Text style={styles.aboutCardTitle}>Seamless Pathways</Text>
              <Text style={styles.aboutCardText}>
                Verified athlete profiles allow clubs to identify candidates who meet their technical standards before spending resources on physical trial travel.
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================
            CALL TO ACTION BANNER
           ======================================================== */}
        <View style={styles.ctaBanner}>
          <View style={styles.ctaInner}>
            <Text style={styles.ctaTitle}>Ready to Measure Your Football Skill?</Text>
            <Text style={styles.ctaSubtitle}>
              Create a free athlete profile or register your academy coaching staff to begin testing and scouting today.
            </Text>
            <View style={styles.ctaButtons}>
              <TouchableOpacity
                style={styles.ctaPrimaryButton}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.ctaPrimaryText}>Create Athlete Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ctaSecondaryButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.ctaSecondaryText}>Sign In Existing Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Footer
          navigation={navigation}
          onNavigateSection={(sectionKey) => {
            if (sectionKey === 'home') scrollToSection('hero');
            else if (sectionKey === 'how-it-works') scrollToSection('howItWorks');
            else if (sectionKey === 'player-assessment') scrollToSection('features');
            else if (sectionKey === 'for-coaches') scrollToSection('coaches');
            else if (sectionKey === 'about') scrollToSection('about');
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Hero Section
  heroSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  heroSectionDesktop: {
    paddingVertical: SPACING.hero,
  },
  heroContentInner: {
    maxWidth: 1240,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 36,
  },
  heroTextColumn: {
    flex: 1,
    minWidth: 300,
  },
  heroCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  heroCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    letterSpacing: 0.3,
  },
  heroHeadline: {
    fontSize: 38,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: 16,
  },
  heroHeadlineAccent: {
    color: COLORS.primary,
  },
  heroDescription: {
    fontSize: 16,
    lineHeight: 25,
    color: COLORS.textSecondary,
    marginBottom: 28,
  },
  heroActionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    marginBottom: 36,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
    ...SHADOWS.subtle,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 20,
  },
  statItem: {
    flexDirection: 'column',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  heroImageColumn: {
    flex: 1,
    minWidth: 320,
  },
  heroImageCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
    position: 'relative',
    ...SHADOWS.elevated,
  },
  heroImage: {
    width: '100%',
    height: 380,
  },
  heroFloatingBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADIUS.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  heroBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  heroBadgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  heroBadgeSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  // Sections
  sectionLight: {
    backgroundColor: '#FFFFFF',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  sectionNeutral: {
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    maxWidth: 760,
    width: '100%',
    marginHorizontal: 'auto',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  sectionCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Steps Grid
  stepsGrid: {
    maxWidth: 1240,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  stepsGridDesktop: {
    flexWrap: 'nowrap',
  },
  stepCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    position: 'relative',
    ...SHADOWS.card,
  },
  stepNumberBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.border,
  },
  stepIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  // Features Grid
  featuresGrid: {
    maxWidth: 1240,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  featuresGridDesktop: {
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  featureIconBadge: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  // Coach Section
  coachSection: {
    backgroundColor: COLORS.darkSection,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  coachInner: {
    maxWidth: 1240,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 36,
  },
  coachInnerDesktop: {
    flexWrap: 'nowrap',
  },
  coachTextColumn: {
    flex: 1,
    minWidth: 300,
  },
  coachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkSurface,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  coachBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  coachHeadline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  coachDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textLightMuted,
    marginBottom: 24,
  },
  coachHighlights: {
    gap: 10,
    marginBottom: 28,
  },
  coachHighlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  coachHighlightText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
    flex: 1,
  },
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  coachButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coachImageColumn: {
    flex: 1,
    minWidth: 320,
  },
  coachImageWrapper: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    ...SHADOWS.elevated,
  },
  coachImage: {
    width: '100%',
    height: 360,
  },

  // About Section
  aboutGrid: {
    maxWidth: 1240,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  aboutGridDesktop: {
    flexWrap: 'nowrap',
  },
  aboutCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  aboutCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  aboutCardText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  // CTA Banner
  ctaBanner: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  ctaInner: {
    maxWidth: 820,
    width: '100%',
    marginHorizontal: 'auto',
    alignItems: 'center',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.primaryLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  ctaButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
  ctaPrimaryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  ctaPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  ctaSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
