import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../services/apiConfig';
import FootballImage from '../components/FootballImage';
import SocialAuthModal from '../components/SocialAuthModal';
import { FOOTBALL_MEDIA } from '../constants/footballMedia';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [email, setEmail] = useState('player@scoutx.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
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

  const openSocialAuth = (provider) => {
    setErrorMessage('');
    setSocialProvider(provider);
    setSocialModalVisible(true);
  };

  const handleLogin = async () => {
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const verifiedRole = (
          data.data?.role ||
          data.user?.role ||
          'player'
        ).toLowerCase();

        const sessionData = {
          userRole: verifiedRole,
          userId: data.data?._id || data.data?.user_id || data.user?.id,
          userEmail: data.data?.email || data.user?.email || email.trim().toLowerCase(),
          userName: data.data?.name || data.user?.name || 'Football User',
          userToken: data.data?.token || data.token,
          userLocation: data.data?.location || { state: 'Karnataka', city: 'Bengaluru' },
          playerProfile: data.data?.profile,
        };

        saveSessionAndNavigate(sessionData);
      } else {
        // Real validation error from server (401, 400, etc.)
        setErrorMessage(data.message || 'Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('[Login Error]:', error);
      setErrorMessage('Unable to connect to the authentication service. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
    setErrorMessage('');
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

      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.loginLayout, isDesktop && styles.loginLayoutDesktop]}>
            {/* Left Desktop Side Panel (Genuine Football Training Imagery) */}
            {isDesktop && (
              <View style={styles.sidePanel}>
                <FootballImage
                  source={FOOTBALL_MEDIA.authPanel}
                  style={styles.sidePanelImage}
                  title="Player Performance & Skill Analytics"
                  icon="football-outline"
                />
                <View style={styles.sidePanelOverlay}>
                  <View style={styles.sidePanelBadge}>
                    <Text style={styles.sidePanelBadgeText}>OBJECTIVE VERIFICATION</Text>
                  </View>
                  <Text style={styles.sidePanelHeading}>
                    Measure What Matters on the Pitch.
                  </Text>
                  <Text style={styles.sidePanelSubtext}>
                    Access computer vision scores for dribbling agility, shooting velocity, and ball control accuracy.
                  </Text>
                </View>
              </View>
            )}

            {/* Right Side / Form Area */}
            <View style={[styles.formPanel, isDesktop && styles.formPanelDesktop]}>
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>Sign In to ScoutX-AI</Text>
                  <Text style={styles.formSubtitle}>
                    Enter your email and password to access your football dashboard.
                  </Text>
                </View>

                {/* Error Banner */}
                {errorMessage ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color={COLORS.accentRed} style={{ marginRight: 8 }} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Email Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="name@academy.com"
                      placeholderTextColor={COLORS.textMuted}
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        setErrorMessage('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.passwordLabelRow}>
                    <Text style={styles.inputLabel}>Password</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.inputField, { paddingRight: 40 }]}
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
                      style={styles.showPasswordBtn}
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

                {/* Submit Action */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>

                {/* OR Divider */}
                <View style={styles.oauthDivider}>
                  <View style={styles.oauthDividerLine} />
                  <Text style={styles.oauthDividerText}>OR CONTINUE WITH</Text>
                  <View style={styles.oauthDividerLine} />
                </View>

                {/* Social Authentication Buttons */}
                <View style={styles.socialButtonsGroup}>
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={() => openSocialAuth('google')}
                    disabled={loading}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Google"
                  >
                    <Ionicons name="logo-google" size={17} color="#EA4335" style={{ marginRight: 8 }} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.appleButton}
                    onPress={() => openSocialAuth('apple')}
                    disabled={loading}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Apple"
                  >
                    <Ionicons name="logo-apple" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.appleButtonText}>Continue with Apple</Text>
                  </TouchableOpacity>
                </View>

                {/* Switch to Register */}
                <View style={styles.switchAuthRow}>
                  <Text style={styles.switchAuthPrompt}>Don't have an account?</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.switchAuthLink}> Create an account</Text>
                  </TouchableOpacity>
                </View>

                {/* Demo Accounts Helper */}
                <View style={styles.demoAccountsSection}>
                  <Text style={styles.demoAccountsHeading}>PRE-SEEDED DEMO ACCOUNTS</Text>
                  <View style={styles.demoPills}>
                    <TouchableOpacity
                      style={[styles.demoPill, email === 'player@scoutx.com' && styles.demoPillActive]}
                      onPress={() => setDemoAccount('player@scoutx.com')}
                    >
                      <Ionicons name="football" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.demoPillText}>Player</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.demoPill, email === 'coach@scoutx.com' && styles.demoPillActive]}
                      onPress={() => setDemoAccount('coach@scoutx.com')}
                    >
                      <Ionicons name="briefcase" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.demoPillText}>Coach / Scout</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.demoPill, email === 'admin@scoutx.com' && styles.demoPillActive]}
                      onPress={() => setDemoAccount('admin@scoutx.com')}
                    >
                      <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.demoPillText}>Admin</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SocialAuthModal
        visible={socialModalVisible}
        provider={socialProvider}
        role="player"
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
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  loginLayout: {
    maxWidth: 960,
    width: '100%',
    marginHorizontal: 'auto',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  loginLayoutDesktop: {
    flexDirection: 'row',
    minHeight: 560,
  },
  sidePanel: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.darkSection,
  },
  sidePanelImage: {
    width: '100%',
    height: '100%',
  },
  sidePanelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  sidePanelBadge: {
    backgroundColor: 'rgba(21, 128, 61, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  sidePanelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  sidePanelHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 28,
  },
  sidePanelSubtext: {
    fontSize: 13,
    color: COLORS.textLightMuted,
    lineHeight: 18,
  },
  formPanel: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  formPanelDesktop: {
    maxWidth: 480,
  },
  formCard: {
    width: '100%',
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  inputIcon: {
    paddingLeft: 12,
  },
  inputField: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  showPasswordBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
    marginTop: 8,
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
    marginBottom: 20,
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
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  demoAccountsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  demoAccountsHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    textAlign: 'center',
  },
  demoPills: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
  },
  demoPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
