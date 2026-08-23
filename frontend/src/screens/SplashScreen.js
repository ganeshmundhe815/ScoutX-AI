import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    // Optional auto-redirect after 3 seconds, or athlete can press "Get Started"
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      
      <View style={styles.content}>
        {/* Animated Trophy Icon */}
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="trophy-award" size={70} color="#38BDF8" />
        </View>

        {/* Brand Title */}
        <Text style={styles.title}>ScoutX AI</Text>
        <Text style={styles.tagline}>
          Democratizing Sports Talent Assessment
        </Text>

        {/* Hackathon Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🏅 SIH 2025 • Khelo India KIRTI</Text>
        </View>

        <Text style={styles.subtext}>
          Turning standard smartphones into AI sports science assessment labs.
        </Text>
      </View>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.primaryButtonText}>Get Started ➔</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Version 1.0.0 • Mobile First</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#38BDF8',
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  subtext: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  footer: {
    padding: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    color: '#475569',
    fontSize: 12,
    marginTop: 14,
  },
});
