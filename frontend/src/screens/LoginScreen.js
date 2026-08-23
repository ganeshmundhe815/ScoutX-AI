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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../services/apiConfig';

export default function LoginScreen({ navigation }) {
  const [role, setRole] = useState('athlete');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
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
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        navigation.replace('Home', {
          userRole: data.data?.role || role,
          userEmail: data.data?.email || email,
          userName: data.data?.name || email.split('@')[0],
          userState: data.data?.state || 'Maharashtra',
          userDistrict: data.data?.district || 'Pune',
          athleteId: data.data?.athleteProfile?.athleteId || 'SAI-482910',
          userSport: data.data?.athleteProfile?.primarySport || 'Athletics',
        });
      } else {
        // Fallback for offline demo
        navigation.replace('Home', {
          userRole: role,
          userEmail: email,
          userName: email.split('@')[0],
        });
      }
    } catch (error) {
      console.warn(`[Login Warning]: ${error.message}. Running in offline mode.`);
      navigation.replace('Home', {
        userRole: role,
        userEmail: email,
        userName: email.split('@')[0],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>ScoutX AI 🏆</Text>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subText}>Sign in to access your sports assessment profile</Text>
          </View>

          {/* Role Selection Tabs */}
          <View style={styles.roleToggleContainer}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                role === 'athlete' && styles.roleTabActive,
              ]}
              onPress={() => setRole('athlete')}
            >
              <Ionicons
                name="fitness"
                size={18}
                color={role === 'athlete' ? '#FFFFFF' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.roleTabText,
                  role === 'athlete' && styles.roleTabTextActive,
                ]}
              >
                Athlete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTab,
                role === 'scout' && styles.roleTabActive,
              ]}
              onPress={() => setRole('scout')}
            >
              <Ionicons
                name="search"
                size={18}
                color={role === 'scout' ? '#FFFFFF' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.roleTabText,
                  role === 'scout' && styles.roleTabTextActive,
                ]}
              >
                Coach / Scout
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Inputs */}
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="athlete@example.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Quick Demo Fill Helper */}
            <TouchableOpacity
              style={styles.demoFillBtn}
              onPress={() => {
                setEmail(role === 'athlete' ? 'rahul.athlete@scoutx.com' : 'coach.patil@scoutx.com');
                setPassword('password123');
              }}
            >
              <Text style={styles.demoFillText}>⚡ Quick Demo Fill</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Sign In as {role === 'athlete' ? 'Athlete' : 'Scout'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Navigation to Register */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account yet? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    marginBottom: 28,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38BDF8',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  subText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  roleTabActive: {
    backgroundColor: '#3B82F6',
  },
  roleTabText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },
  form: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  demoFillBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 10,
  },
  demoFillText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  registerLink: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
});
