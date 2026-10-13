import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    // Smooth fade & pop animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Check for persisted user session (Preserve state on refresh)
    const timer = setTimeout(() => {
      let savedSession = null;
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem('scoutx_user_session');
          if (raw) {
            savedSession = JSON.parse(raw);
          }
        } catch (e) {
          console.warn('[Session Restore Error]:', e);
        }
      }

      if (savedSession && savedSession.userName) {
        navigation.replace('Home', savedSession);
      } else {
        navigation.replace('Landing');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glowing Football Icon */}
        <View style={styles.iconWrapper}>
          <Ionicons name="football" size={56} color="#10B981" />
        </View>

        {/* Title */}
        <Text style={styles.appName}>ScoutX AI</Text>
        <Text style={styles.tagline}>AI-Powered Football Talent Assessment</Text>
        <Text style={styles.subTagline}>Democratizing Football Scouting Across India ⚽</Text>

        {/* Football Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>YOLO + MediaPipe AI</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <Text style={[styles.badgeText, { color: '#10B981' }]}>Grassroots Scouting</Text>
          </View>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Designed for Players • Coaches • Scouts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 8,
    textAlign: 'center',
  },
  subTagline: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  badge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
});
