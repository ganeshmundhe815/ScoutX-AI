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

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState('athlete');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stateName, setStateName] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [sport, setSport] = useState('Athletics');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please fill in Name, Email, and Password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Send registration data to Express Backend API
      const response = await fetch(`${BASE_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          state: stateName,
          district,
          primarySport: sport,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        Alert.alert(
          'Account Created in MongoDB 🎉',
          `Welcome to ScoutX AI, ${name}!\nYour ${role} profile has been saved to the database.`,
          [
            {
              text: 'Go to Dashboard',
              onPress: () => {
                navigation.replace('Home', {
                  userRole: role,
                  userEmail: email,
                  userName: name,
                  userToken: data.data?.token,
                  userState: stateName,
                  userDistrict: district,
                  userSport: sport,
                  athleteId: data.data?.athleteProfile?.athleteId,
                });
              },
            },
          ]
        );
      } else {
        // Fallback for offline demo mode
        navigation.replace('Home', {
          userRole: role,
          userEmail: email,
          userName: name,
          userState: stateName,
          userDistrict: district,
          userSport: sport,
        });
      }
    } catch (error) {
      console.warn(`[Register API Warning]: ${error.message}. Proceeding in offline demo mode.`);
      navigation.replace('Home', {
        userRole: role,
        userEmail: email,
        userName: name,
        userState: stateName,
        userDistrict: district,
        userSport: sport,
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subText}>Register as an Athlete or Scout on the National Talent Grid</Text>
          </View>

          {/* Role Tabs */}
          <View style={styles.roleToggleContainer}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                role === 'athlete' && styles.roleTabActive,
              ]}
              onPress={() => setRole('athlete')}
            >
              <Ionicons
                name="person"
                size={16}
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
                name="shield-checkmark"
                size={16}
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

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#64748B"
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="rahul@scoutx.com"
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
                placeholder="Minimum 6 characters"
                placeholderTextColor="#64748B"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>State</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Maharashtra"
                    placeholderTextColor="#64748B"
                    value={stateName}
                    onChangeText={setStateName}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>District</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Pune"
                    placeholderTextColor="#64748B"
                    value={district}
                    onChangeText={setDistrict}
                  />
                </View>
              </View>
            </View>

            {role === 'athlete' && (
              <>
                <Text style={styles.inputLabel}>Primary Sport Discipline</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="football-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Athletics / Football / Cricket"
                    placeholderTextColor="#64748B"
                    value={sport}
                    onChangeText={setSport}
                  />
                </View>
              </>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.85}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Register as {role === 'athlete' ? 'Athlete' : 'Scout'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
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
    flexGrow: 1,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
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
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: '#3B82F6',
  },
  roleTabText: {
    color: '#94A3B8',
    fontSize: 13,
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
    marginBottom: 6,
    marginTop: 10,
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
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
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
    marginVertical: 16,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  loginLink: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
});
