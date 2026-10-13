import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../services/apiConfig';
import SocialAuthModal from '../components/SocialAuthModal';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const FOOTBALL_POSITIONS = [
  'Striker',
  'Winger',
  'Attacking Midfielder',
  'Central Midfielder',
  'Defensive Midfielder',
  'Fullback',
  'Center Back',
  'Goalkeeper',
];

const PREFERRED_FEET = ['Right', 'Left', 'Both'];

export default function RegisterScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // Check if role was pre-selected (e.g., from "Join as a Coach" button)
  const initialRole = route?.params?.preselectedRole === 'coach' ? 'coach' : 'player';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [stateName, setStateName] = useState('Maharashtra');
  const [city, setCity] = useState('Pune');

  // Player fields
  const [age, setAge] = useState('17');
  const [position, setPosition] = useState('Striker');
  const [preferredFoot, setPreferredFoot] = useState('Right');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [clubOrTeam, setClubOrTeam] = useState('Grassroots Academy');

  // Coach fields
  const [clubOrAcademy, setClubOrAcademy] = useState('Youth Football Scouts');
  const [licenseLevel, setLicenseLevel] = useState('AFC C License');
  const [experienceYears, setExperienceYears] = useState('5');

  const [loading, setLoading] = useState(false);
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialProvider, setSocialProvider] = useState('google');
  const [errorMessage, setErrorMessage] = useState('');

  const saveSessionAndNavigate = (sessionData) => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('scoutx_user_session', JSON.stringify(sessionData));
        if (sessionData.userToken) {
          localStorage.setItem('scoutx_token', sessionData.userToken);
        }
      } catch (e) {
        console.warn('[Session Save Error]:', e);
      }
    }
    navigation.replace('Home', sessionData);
  };

  const openSocialRegister = (provider) => {
    setErrorMessage('');
    setSocialProvider(provider);
    setSocialModalVisible(true);
  };

  const handleRegister = async () => {
    setErrorMessage('');

    // Common validations
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    // Athlete height & weight validation (optional)
    if (role === 'player') {
      if (heightCm.trim()) {
        const h = Number(heightCm.trim());
        if (isNaN(h) || h < 80 || h > 250) {
          setErrorMessage('Height must be a valid number between 80 cm and 250 cm.');
          return;
        }
      }
      if (weightKg.trim()) {
        const w = Number(weightKg.trim());
        if (isNaN(w) || w < 25 || w > 200) {
          setErrorMessage('Weight must be a valid number between 25 kg and 200 kg.');
          return;
        }
      }
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        state: stateName,
        district: city,
        city,
        ...(role === 'player' && {
          age: Number(age) || 17,
          position,
          preferredFoot,
          clubOrTeam,
          heightCm: heightCm.trim() ? Number(heightCm.trim()) : null,
          weightKg: weightKg.trim() ? Number(weightKg.trim()) : null,
        }),
        ...(role === 'coach' && {
          clubOrAcademy,
          licenseLevel,
          experienceYears: Number(experienceYears) || 3,
        }),
      };

      const response = await fetch(`${BASE_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const sessionData = {
          userRole: role,
          userId: data.data?._id || data.data?.user_id,
          userEmail: email.trim().toLowerCase(),
          userName: name.trim(),
          userToken: data.data?.token,
          userLocation: { state: stateName, district: city, city },
          playerProfile: data.data?.profile,
        };

        saveSessionAndNavigate(sessionData);
      } else {
        // Real validation error from server (e.g. Email exists, 403 Forbidden on code)
        setErrorMessage(data.message || 'Registration failed. Please check the provided information.');
      }
    } catch (error) {
      console.error('[Register Error]:', error);
      setErrorMessage('Unable to connect to the registration service. Please verify your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header / Back Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Landing')}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.brand}
          onPress={() => navigation.navigate('Landing')}
        >
          <View style={styles.logoBadge}>
            <Ionicons name="football" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.brandName}>ScoutX<Text style={styles.brandAccent}>.AI</Text></Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Header Block */}
          <View style={styles.formHeader}>
            <Text style={styles.pageTitle}>Create ScoutX-AI Account</Text>
            <Text style={styles.pageSubtitle}>
              Join the football talent intelligence network. Select your primary role to begin.
            </Text>
          </View>

          {/* Role Segmented Selector */}
          <View style={styles.roleSelectorGroup}>
            <Text style={styles.sectionLabel}>Select Your Platform Role</Text>
            <View style={styles.roleCardsRow}>
              {/* Role 1: Player */}
              <TouchableOpacity
                style={[styles.roleCard, role === 'player' && styles.roleCardActive]}
                onPress={() => {
                  setRole('player');
                  setErrorMessage('');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.roleIconBadge, role === 'player' && styles.roleIconBadgeActive]}>
                  <Ionicons
                    name="football"
                    size={20}
                    color={role === 'player' ? COLORS.primary : COLORS.textSecondary}
                  />
                </View>
                <Text style={[styles.roleCardTitle, role === 'player' && styles.roleCardTitleActive]}>
                  Player / Athlete
                </Text>
                <Text style={styles.roleCardDesc}>Record drills & build verified performance profile</Text>
              </TouchableOpacity>

              {/* Role 2: Coach */}
              <TouchableOpacity
                style={[styles.roleCard, role === 'coach' && styles.roleCardActive]}
                onPress={() => {
                  setRole('coach');
                  setErrorMessage('');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.roleIconBadge, role === 'coach' && styles.roleIconBadgeActive]}>
                  <Ionicons
                    name="briefcase"
                    size={20}
                    color={role === 'coach' ? COLORS.primary : COLORS.textSecondary}
                  />
                </View>
                <Text style={[styles.roleCardTitle, role === 'coach' && styles.roleCardTitleActive]}>
                  Coach / Scout
                </Text>
                <Text style={styles.roleCardDesc}>Discover grassroots players & shortlist talent</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={COLORS.accentRed} style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Fields Card */}
          <View style={styles.fieldsCard}>
            <Text style={styles.cardSectionTitle}>Account Credentials</Text>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Sunil Chhetri"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setErrorMessage('');
                }}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="name@footballacademy.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password & Confirm Password */}
            <View style={[styles.twoColRow, isDesktop && styles.twoColRowDesktop]}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Password (min. 6 characters)</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={[styles.textInput, { paddingRight: 42 }]}
                    placeholder="••••••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={[styles.textInput, { paddingRight: 42 }]}
                    placeholder="••••••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      setErrorMessage('');
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                    }
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Geographic Location */}
            <View style={[styles.twoColRow, isDesktop && styles.twoColRowDesktop]}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.textInput}
                  value={stateName}
                  onChangeText={setStateName}
                  placeholder="e.g. Maharashtra"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>City / District</Text>
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Pune"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            {/* ROLE-SPECIFIC FIELDS */}

            {/* 1. PLAYER SPECIFIC */}
            {role === 'player' && (
              <View style={styles.roleSpecificSection}>
                <Text style={styles.cardSectionTitle}>Athlete Profile Details</Text>

                <View style={[styles.twoColRow, isDesktop && styles.twoColRowDesktop]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Age</Text>
                    <TextInput
                      style={styles.textInput}
                      value={age}
                      onChangeText={setAge}
                      keyboardType="numeric"
                      placeholder="17"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Club / Current Academy</Text>
                    <TextInput
                      style={styles.textInput}
                      value={clubOrTeam}
                      onChangeText={setClubOrTeam}
                      placeholder="e.g. Pune City Youth"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                </View>

                {/* Playing Position Selector */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Playing Position</Text>
                  <View style={styles.pillRow}>
                    {FOOTBALL_POSITIONS.map((pos) => (
                      <TouchableOpacity
                        key={pos}
                        style={[styles.selectorPill, position === pos && styles.selectorPillActive]}
                        onPress={() => setPosition(pos)}
                      >
                        <Text style={[styles.selectorPillText, position === pos && styles.selectorPillTextActive]}>
                          {pos}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Preferred Foot */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Preferred Foot</Text>
                  <View style={styles.pillRow}>
                    {PREFERRED_FEET.map((foot) => (
                      <TouchableOpacity
                        key={foot}
                        style={[styles.selectorPill, preferredFoot === foot && styles.selectorPillActive]}
                        onPress={() => setPreferredFoot(foot)}
                      >
                        <Text style={[styles.selectorPillText, preferredFoot === foot && styles.selectorPillTextActive]}>
                          {foot}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Height & Weight Optional Measurements */}
                <View style={[styles.twoColRow, isDesktop && styles.twoColRowDesktop]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>
                      Height (cm) <Text style={styles.optionalHint}>(Optional, 80-250)</Text>
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={heightCm}
                      onChangeText={(t) => {
                        setHeightCm(t);
                        setErrorMessage('');
                      }}
                      keyboardType="numeric"
                      placeholder="e.g. 175 (Leave empty if unmeasured)"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>
                      Weight (kg) <Text style={styles.optionalHint}>(Optional, 25-200)</Text>
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={weightKg}
                      onChangeText={(t) => {
                        setWeightKg(t);
                        setErrorMessage('');
                      }}
                      keyboardType="numeric"
                      placeholder="e.g. 68 (Leave empty if unmeasured)"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* 2. COACH SPECIFIC */}
            {role === 'coach' && (
              <View style={styles.roleSpecificSection}>
                <Text style={styles.cardSectionTitle}>Coaching Credentials</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Club or Academy Organization</Text>
                  <TextInput
                    style={styles.textInput}
                    value={clubOrAcademy}
                    onChangeText={setClubOrAcademy}
                    placeholder="e.g. Bengaluru Youth Scouts"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>

                <View style={[styles.twoColRow, isDesktop && styles.twoColRowDesktop]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>License Level</Text>
                    <TextInput
                      style={styles.textInput}
                      value={licenseLevel}
                      onChangeText={setLicenseLevel}
                      placeholder="e.g. AFC C License / UEFA B"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Years of Scouting Experience</Text>
                    <TextInput
                      style={styles.textInput}
                      value={experienceYears}
                      onChangeText={setExperienceYears}
                      keyboardType="numeric"
                      placeholder="5"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Submit Action */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    Create {role === 'coach' ? 'Coach' : 'Athlete'} Account
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>

            {/* OR Divider */}
            <View style={styles.oauthDivider}>
              <View style={styles.oauthDividerLine} />
              <Text style={styles.oauthDividerText}>OR REGISTER WITH</Text>
              <View style={styles.oauthDividerLine} />
            </View>

            {/* Social Registration Buttons */}
            <View style={styles.socialButtonsGroup}>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={() => openSocialRegister('google')}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Sign up with Google"
              >
                <Ionicons name="logo-google" size={17} color="#EA4335" style={{ marginRight: 8 }} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.appleButton}
                onPress={() => openSocialRegister('apple')}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Sign up with Apple"
              >
                <Ionicons name="logo-apple" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Switch to Login */}
            <View style={styles.switchAuthRow}>
              <Text style={styles.switchAuthPrompt}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.switchAuthLink}> Sign in instead</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <SocialAuthModal
        visible={socialModalVisible}
        provider={socialProvider}
        role={role}
        onClose={() => setSocialModalVisible(false)}
        onSuccess={(sessionData) => saveSessionAndNavigate(sessionData)}
        onError={(err) => setErrorMessage(err)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  scrollContent: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  formContainer: {
    maxWidth: 780,
    width: '100%',
    marginHorizontal: 'auto',
  },
  formHeader: {
    marginBottom: 24,
    textAlign: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  roleSelectorGroup: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleCardsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  roleCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...SHADOWS.subtle,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  roleIconBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  roleIconBadgeActive: {
    backgroundColor: COLORS.primaryLight,
  },
  roleCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  roleCardTitleActive: {
    color: COLORS.primaryDark,
  },
  roleCardDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.sm,
    padding: 12,
    marginBottom: 18,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.accentRed,
    fontWeight: '500',
    flex: 1,
  },
  fieldsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  twoColRow: {
    flexDirection: 'column',
    gap: 12,
  },
  twoColRowDesktop: {
    flexDirection: 'row',
  },
  roleSpecificSection: {
    marginTop: 12,
    paddingTop: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
  },
  selectorPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  selectorPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectorPillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  adminSecurityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: RADIUS.sm,
    padding: 12,
    marginBottom: 16,
  },
  adminSecurityText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    lineHeight: 18,
    flex: 1,
  },
  fieldHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
    marginTop: 12,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  switchAuthPrompt: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  switchAuthLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  passwordInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeToggleBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
    zIndex: 2,
  },
  optionalHint: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.textMuted,
  },
  oauthDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  oauthDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  oauthDividerText: {
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  socialButtonsGroup: {
    gap: 10,
    marginBottom: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    ...SHADOWS.subtle,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  appleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
