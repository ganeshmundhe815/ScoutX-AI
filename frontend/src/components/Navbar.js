import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function Navbar({
  navigation,
  user = null,
  activeSection = 'home',
  onNavigateSection,
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 820;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavPress = (sectionKey, routeName) => {
    setMobileMenuOpen(false);
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

  const handleLogout = () => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('scoutx_user_session');
        localStorage.removeItem('scoutx_token');
      } catch (e) {
        // ignore
      }
    }
    if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    }
  };

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.navContainer}>
        {/* Logo / Brand Wordmark */}
        <TouchableOpacity
          style={styles.brand}
          onPress={() => {
            if (user && navigation) {
              navigation.navigate('Home', user);
            } else if (navigation) {
              navigation.navigate('Landing');
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.logoBadge}>
            <Ionicons name="football" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.brandTextGroup}>
            <Text style={styles.brandName}>ScoutX<Text style={styles.brandAccent}>.AI</Text></Text>
            <Text style={styles.brandSubtitle}>FOOTBALL INTELLIGENCE</Text>
          </View>
        </TouchableOpacity>

        {/* Desktop Navigation Links */}
        {!isMobile && (
          <View style={styles.navLinks}>
            <TouchableOpacity
              onPress={() => handleNavPress('home', 'Landing')}
              style={[styles.navLink, activeSection === 'home' && styles.navLinkActive]}
            >
              <Text style={[styles.navLinkText, activeSection === 'home' && styles.navLinkTextActive]}>
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleNavPress('how-it-works')}
              style={[styles.navLink, activeSection === 'how-it-works' && styles.navLinkActive]}
            >
              <Text style={[styles.navLinkText, activeSection === 'how-it-works' && styles.navLinkTextActive]}>
                How It Works
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleNavPress('player-assessment')}
              style={[styles.navLink, activeSection === 'player-assessment' && styles.navLinkActive]}
            >
              <Text style={[styles.navLinkText, activeSection === 'player-assessment' && styles.navLinkTextActive]}>
                Player Assessment
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleNavPress('for-coaches')}
              style={[styles.navLink, activeSection === 'for-coaches' && styles.navLinkActive]}
            >
              <Text style={[styles.navLinkText, activeSection === 'for-coaches' && styles.navLinkTextActive]}>
                For Coaches
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleNavPress('about')}
              style={[styles.navLink, activeSection === 'about' && styles.navLinkActive]}
            >
              <Text style={[styles.navLinkText, activeSection === 'about' && styles.navLinkTextActive]}>
                About
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Auth / Profile Area */}
        {!isMobile && (
          <View style={styles.authArea}>
            {user ? (
              <View style={styles.userControls}>
                <View style={styles.userBadge}>
                  <Text style={styles.userName}>{user.userName || user.name || 'User'}</Text>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>{(user.role || 'PLAYER').toUpperCase()}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.dashboardButton}
                  onPress={() => navigation && navigation.navigate('Home', user)}
                >
                  <Ionicons name="grid-outline" size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.dashboardButtonText}>Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.authButtons}>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => navigation && navigation.navigate('Login')}
                >
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => navigation && navigation.navigate('Register')}
                >
                  <Text style={styles.registerButtonText}>Register</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Mobile Hamburger Toggle */}
        {isMobile && (
          <TouchableOpacity
            style={styles.hamburger}
            onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Ionicons
              name={mobileMenuOpen ? 'close' : 'menu'}
              size={24}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Mobile Drawer Dropdown */}
      {isMobile && mobileMenuOpen && (
        <View style={styles.mobileDropdown}>
          <TouchableOpacity
            style={styles.mobileLink}
            onPress={() => handleNavPress('home', 'Landing')}
          >
            <Text style={styles.mobileLinkText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mobileLink}
            onPress={() => handleNavPress('how-it-works')}
          >
            <Text style={styles.mobileLinkText}>How It Works</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mobileLink}
            onPress={() => handleNavPress('player-assessment')}
          >
            <Text style={styles.mobileLinkText}>Player Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mobileLink}
            onPress={() => handleNavPress('for-coaches')}
          >
            <Text style={styles.mobileLinkText}>For Coaches</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mobileLink}
            onPress={() => handleNavPress('about')}
          >
            <Text style={styles.mobileLinkText}>About</Text>
          </TouchableOpacity>

          <View style={styles.mobileDivider} />

          {user ? (
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                style={[styles.registerButton, { width: '100%', alignItems: 'center' }]}
                onPress={() => {
                  setMobileMenuOpen(false);
                  navigation && navigation.navigate('Home', user);
                }}
              >
                <Text style={styles.registerButtonText}>Go to Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginButton, { width: '100%', alignItems: 'center' }]}
                onPress={handleLogout}
              >
                <Text style={styles.loginButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                style={[styles.loginButton, { width: '100%', alignItems: 'center' }]}
                onPress={() => {
                  setMobileMenuOpen(false);
                  navigation && navigation.navigate('Login');
                }}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.registerButton, { width: '100%', alignItems: 'center' }]}
                onPress={() => {
                  setMobileMenuOpen(false);
                  navigation && navigation.navigate('Register');
                }}
              >
                <Text style={styles.registerButtonText}>Register</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 100,
    width: '100%',
  },
  navContainer: {
    maxWidth: 1240,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandTextGroup: {
    flexDirection: 'column',
  },
  brandName: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginTop: -2,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  navLink: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  navLinkActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  navLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  navLinkTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  authArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  registerButton: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  roleTag: {
    backgroundColor: COLORS.backgroundTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  dashboardButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  logoutButton: {
    padding: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  hamburger: {
    padding: 6,
  },
  mobileDropdown: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  mobileLink: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  mobileLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  mobileDivider: {
    height: 16,
  },
});
