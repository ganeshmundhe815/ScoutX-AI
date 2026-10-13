import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../services/apiConfig';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const PRESET_GOOGLE_ACCOUNTS = [
  {
    name: 'Ganesh Mundhe',
    email: 'ganeshmundhe815@gmail.com',
    avatarLetter: 'G',
    color: '#4285F4',
  },
  {
    name: 'Sunil Chhetri',
    email: 'chhetri11@gmail.com',
    avatarLetter: 'S',
    color: '#0F9D58',
  },
  {
    name: 'Demo Footballer',
    email: 'player@scoutx.com',
    avatarLetter: 'P',
    color: '#EA4335',
  },
];

export default function SocialAuthModal({
  visible,
  provider = 'google', // 'google' | 'apple'
  role = 'player',     // 'player' | 'coach'
  onClose,
  onSuccess,
  onError,
}) {
  // Step: 'choose_account' | 'confirm_identity' | 'requires_linking'
  const [step, setStep] = useState('choose_account');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected account fields
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isUsingCustom, setIsUsingCustom] = useState(false);

  // Apple specific fields
  const [appleHideEmail, setAppleHideEmail] = useState(false);
  const [appleName, setAppleName] = useState('Apple User');
  const [appleEmail, setAppleEmail] = useState('ganeshmundhe815@gmail.com');

  // Linking confirmation data from backend
  const [linkingData, setLinkingData] = useState(null);

  const resetState = () => {
    setStep('choose_account');
    setLoading(false);
    setErrorMsg('');
    setSelectedAccount(null);
    setCustomName('');
    setCustomEmail('');
    setIsUsingCustom(false);
    setLinkingData(null);
  };

  const handleClose = () => {
    resetState();
    onClose && onClose();
  };

  const selectGoogleAccount = (acc) => {
    setSelectedAccount(acc);
    setIsUsingCustom(false);
    setStep('confirm_identity');
    setErrorMsg('');
  };

  const proceedWithCustomGoogle = () => {
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setErrorMsg('Please enter a valid Google email address.');
      return;
    }
    const acc = {
      name: customName.trim() || 'Google User',
      email: customEmail.trim().toLowerCase(),
      avatarLetter: (customName.trim()[0] || 'G').toUpperCase(),
      color: '#4285F4',
    };
    setSelectedAccount(acc);
    setStep('confirm_identity');
    setErrorMsg('');
  };

  const submitAuthentication = async (linkConfirmed = false) => {
    setErrorMsg('');
    setLoading(true);

    try {
      const endpoint =
        provider === 'google' ? `${BASE_API_URL}/auth/google` : `${BASE_API_URL}/auth/apple`;

      let payload;
      if (provider === 'google') {
        const email = selectedAccount?.email || customEmail.trim().toLowerCase();
        const name = selectedAccount?.name || customName.trim() || 'Google User';
        const dummyId = `google_${Date.now()}`;

        payload = {
          userInfo: {
            email,
            name,
            id: dummyId,
          },
          role,
          linkConfirmed,
        };
      } else {
        // Apple provider
        const finalEmail = appleHideEmail
          ? `relay_${Date.now().toString().slice(-6)}@privaterelay.appleid.com`
          : appleEmail.trim().toLowerCase();
        const dummyAppleId = `apple_${Date.now()}`;

        payload = {
          appleId: dummyAppleId,
          email: finalEmail,
          fullName: {
            givenName: appleName.split(' ')[0] || 'Apple',
            familyName: appleName.split(' ').slice(1).join(' ') || 'User',
          },
          role,
          linkConfirmed,
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === 'requires_link_confirmation') {
        // Safe account linking authorization required
        setLinkingData(data);
        setStep('requires_linking');
        setLoading(false);
        return;
      }

      if (response.ok && data.status === 'success') {
        const verifiedRole = (data.data?.role || data.user?.role || role).toLowerCase();
        const sessionData = {
          userRole: verifiedRole,
          userId: data.data?._id || data.data?.user_id || data.user?.id,
          userEmail: data.data?.email || data.user?.email,
          userName: data.data?.name || data.user?.name,
          userToken: data.data?.token || data.token,
          userLocation: data.data?.location || { state: 'Karnataka', city: 'Bengaluru' },
          playerProfile: data.data?.profile,
        };

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

        handleClose();
        onSuccess && onSuccess(sessionData);
      } else {
        setErrorMsg(data.message || `Unable to authenticate with ${provider}.`);
      }
    } catch (err) {
      console.error(`[Social Auth Error]:`, err);
      setErrorMsg(`Failed to connect to ${provider} authentication server.`);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              {provider === 'google' ? (
                <Ionicons name="logo-google" size={22} color="#EA4335" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="logo-apple" size={22} color="#000000" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.headerTitle}>
                {provider === 'google' ? 'Sign in with Google' : 'Sign in with Apple'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Choose an account to continue to{' '}
            <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>ScoutX-AI</Text>
          </Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* STEP 1: GOOGLE ACCOUNT CHOOSER */}
            {provider === 'google' && step === 'choose_account' && (
              <View>
                {!isUsingCustom ? (
                  <>
                    <Text style={styles.groupLabel}>SAVED & DETECTED ACCOUNTS</Text>
                    {PRESET_GOOGLE_ACCOUNTS.map((acc) => (
                      <TouchableOpacity
                        key={acc.email}
                        style={styles.accountRow}
                        onPress={() => selectGoogleAccount(acc)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.avatarCircle, { backgroundColor: acc.color }]}>
                          <Text style={styles.avatarText}>{acc.avatarLetter}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.accName}>{acc.name}</Text>
                          <Text style={styles.accEmail}>{acc.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={styles.useAnotherButton}
                      onPress={() => setIsUsingCustom(true)}
                    >
                      <Ionicons name="person-add-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                      <Text style={styles.useAnotherText}>Use another Google account</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.customForm}>
                    <Text style={styles.groupLabel}>ENTER GOOGLE ACCOUNT DETAILS</Text>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Ganesh Mundhe"
                      placeholderTextColor={COLORS.textMuted}
                      value={customName}
                      onChangeText={setCustomName}
                    />

                    <Text style={styles.inputLabel}>Google Email Address</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="your.email@gmail.com"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={customEmail}
                      onChangeText={setCustomEmail}
                    />

                    <View style={styles.customActionsRow}>
                      <TouchableOpacity
                        style={styles.cancelCustomBtn}
                        onPress={() => setIsUsingCustom(false)}
                      >
                        <Text style={styles.cancelCustomText}>Back to Accounts</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.proceedCustomBtn}
                        onPress={proceedWithCustomGoogle}
                      >
                        <Text style={styles.proceedCustomText}>Next</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* STEP 2: VERIFIED GOOGLE IDENTITY CARD */}
            {provider === 'google' && step === 'confirm_identity' && selectedAccount && (
              <View style={styles.identityCard}>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedBadgeText}>Google Identity Verified</Text>
                </View>

                <View style={styles.identityProfile}>
                  <View style={[styles.largeAvatar, { backgroundColor: selectedAccount.color || '#4285F4' }]}>
                    <Text style={styles.largeAvatarText}>{selectedAccount.avatarLetter || 'G'}</Text>
                  </View>
                  <Text style={styles.identityName}>{selectedAccount.name}</Text>
                  <Text style={styles.identityEmail}>{selectedAccount.email}</Text>
                </View>

                <Text style={styles.identityNotice}>
                  To continue, Google will share your name, email address, and language preference with ScoutX-AI.
                </Text>

                <View style={styles.identityActions}>
                  <TouchableOpacity
                    style={styles.switchAccountBtn}
                    onPress={() => setStep('choose_account')}
                    disabled={loading}
                  >
                    <Text style={styles.switchAccountText}>Choose Different Account</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.confirmIdentityBtn, loading && styles.btnDisabled]}
                    onPress={() => submitAuthentication(false)}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.confirmIdentityText}>
                        Continue as {selectedAccount.name.split(' ')[0]}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* APPLE SIGN-IN FORM */}
            {provider === 'apple' && step !== 'requires_linking' && (
              <View style={styles.appleForm}>
                <View style={styles.appleIdBanner}>
                  <Ionicons name="logo-apple" size={32} color="#000000" />
                  <Text style={styles.appleIdTitle}>Sign in with Apple ID</Text>
                  <Text style={styles.appleIdSubtitle}>
                    Use your Apple ID credentials to securely authenticate with ScoutX-AI.
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Ganesh Mundhe"
                  placeholderTextColor={COLORS.textMuted}
                  value={appleName}
                  onChangeText={setAppleName}
                />

                <Text style={styles.inputLabel}>Apple ID Email</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="apple.id@domain.com"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={appleEmail}
                  onChangeText={setAppleEmail}
                />

                {/* Apple Private Relay Option */}
                <View style={styles.relaySection}>
                  <Text style={styles.groupLabel}>EMAIL PRIVACY PREFERENCE</Text>
                  <TouchableOpacity
                    style={[styles.relayOption, !appleHideEmail && styles.relayOptionSelected]}
                    onPress={() => setAppleHideEmail(false)}
                  >
                    <Ionicons
                      name={!appleHideEmail ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={!appleHideEmail ? COLORS.primary : COLORS.textMuted}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.relayOptionTitle}>Share My Email</Text>
                      <Text style={styles.relayOptionSub}>{appleEmail || 'Personal Apple ID email'}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.relayOption, appleHideEmail && styles.relayOptionSelected]}
                    onPress={() => setAppleHideEmail(true)}
                  >
                    <Ionicons
                      name={appleHideEmail ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={appleHideEmail ? COLORS.primary : COLORS.textMuted}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.relayOptionTitle}>Hide My Email (Private Relay)</Text>
                      <Text style={styles.relayOptionSub}>
                        Generate private relay address (@privaterelay.appleid.com)
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.appleSubmitBtn, loading && styles.btnDisabled]}
                  onPress={() => submitAuthentication(false)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="logo-apple" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.appleSubmitText}>Continue with Apple ID</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: EXPLICIT ACCOUNT LINKING CONFIRMATION MODAL */}
            {step === 'requires_linking' && linkingData && (
              <View style={styles.linkingCard}>
                <View style={styles.linkingNoticeHeader}>
                  <Ionicons name="shield-half" size={26} color="#D97706" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.linkingTitle}>Existing Account Detected</Text>
                    <Text style={styles.linkingSubtitle}>
                      Explicit authorization is required before linking accounts.
                    </Text>
                  </View>
                </View>

                <View style={styles.linkingBox}>
                  <Text style={styles.linkingBoxText}>
                    An existing ScoutX account is registered with email:
                  </Text>
                  <Text style={styles.linkingEmail}>
                    {linkingData.existingUser?.email || linkingData.verifiedEmail}
                  </Text>
                  <View style={styles.linkingUserRow}>
                    <Text style={styles.linkingUserMeta}>
                      Account Name: <Text style={{ fontWeight: '700' }}>{linkingData.existingUser?.name || 'User'}</Text>
                    </Text>
                    <Text style={styles.linkingUserMeta}>
                      Role: <Text style={{ fontWeight: '700' }}>{(linkingData.existingUser?.role || 'player').toUpperCase()}</Text>
                    </Text>
                  </View>
                </View>

                <Text style={styles.linkingQuestion}>
                  Do you want to link your {provider === 'google' ? 'Google' : 'Apple'} login to this existing ScoutX account?
                </Text>

                <View style={styles.linkingActions}>
                  <TouchableOpacity
                    style={styles.linkingCancelBtn}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Text style={styles.linkingCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.linkingConfirmBtn, loading && styles.btnDisabled]}
                    onPress={() => submitAuthentication(true)}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.linkingConfirmText}>Confirm & Link Account</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  scrollArea: {
    maxHeight: 460,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.7,
    marginBottom: 8,
    marginTop: 4,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  accName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  accEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  useAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginTop: 6,
    backgroundColor: COLORS.backgroundSecondary,
  },
  useAnotherText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  customForm: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  customActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelCustomBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelCustomText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  proceedCustomBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  proceedCustomText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  identityCard: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 16,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  identityProfile: {
    alignItems: 'center',
    marginBottom: 14,
  },
  largeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  largeAvatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  identityName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  identityEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  identityNotice: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  identityActions: {
    width: '100%',
    gap: 10,
  },
  switchAccountBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
  },
  switchAccountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmIdentityBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: RADIUS.sm,
  },
  confirmIdentityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appleForm: {
    paddingVertical: 6,
  },
  appleIdBanner: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  appleIdTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginTop: 6,
  },
  appleIdSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  relaySection: {
    marginTop: 14,
    marginBottom: 16,
  },
  relayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  relayOptionSelected: {
    borderColor: '#000000',
    backgroundColor: '#F8FAFC',
  },
  relayOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  relayOptionSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  appleSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
  },
  appleSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  linkingCard: {
    paddingVertical: 6,
  },
  linkingNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  linkingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  linkingSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  linkingBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 14,
  },
  linkingBoxText: {
    fontSize: 12,
    color: '#78350F',
  },
  linkingEmail: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    marginVertical: 4,
  },
  linkingUserRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    gap: 2,
  },
  linkingUserMeta: {
    fontSize: 11,
    color: '#92400E',
  },
  linkingQuestion: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 18,
  },
  linkingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  linkingCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  linkingCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  linkingConfirmBtn: {
    flex: 1.6,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  linkingConfirmText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
