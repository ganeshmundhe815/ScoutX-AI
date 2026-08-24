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
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../services/apiConfig';

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

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState('player');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stateName, setStateName] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [city, setCity] = useState('Pune');

  // Player fields
  const [age, setAge] = useState('17');
  const [position, setPosition] = useState('Striker');
  const [preferredFoot, setPreferredFoot] = useState('Right');
  const [clubOrTeam, setClubOrTeam] = useState('FC Grassroots Pune');
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState('68');

  // Coach fields
  const [clubOrAcademy, setClubOrAcademy] = useState('Youth Football Scouts');
  const [licenseLevel, setLicenseLevel] = useState('AFC C / UEFA C');
  const [experienceYears, setExperienceYears] = useState('5');

  const [loading, setLoading] = useState(false);

  const saveSessionAndNavigate = (sessionData) => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('scoutx_user_session', JSON.stringify(sessionData));
      } catch (e) {
        console.warn('[Session Save Error]:', e);
      }
    }
    navigation.replace('Home', sessionData);
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please fill in Name, Email, and Password.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        state: stateName,
        district,
        city,
        ...(role === 'player' && {
          age: Number(age),
          position,
          preferredFoot,
          clubOrTeam,
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
        }),
        ...(role === 'coach' && {
          clubOrAcademy,
          licenseLevel,
          experienceYears: Number(experienceYears),
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
          userEmail: email,
          userName: name,
          userToken: data.data?.token,
          userLocation: { state: stateName, district, city },
          playerProfile: data.data?.profile,
        };
        saveSessionAndNavigate(sessionData);
      } else {
        const fallbackSession = {
          userRole: role,
          userEmail: email,
          userName: name,
          userLocation: { state: stateName, city },
        };
        saveSessionAndNavigate(fallbackSession);
      }
    } catch (error) {
      console.warn(`[Register Notice]: ${error.message}. Running in offline session.`);
      const offlineSession = {
        userRole: role,
        userEmail: email,
        userName: name,
        userLocation: { state: stateName, city },
      };
      saveSessionAndNavigate(offlineSession);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create ScoutX Account</Text>
          <Text style={styles.headerSub}>Democratizing Football Scouting Across India 🇮🇳</Text>
        </View>

        {/* Role Selector Tabs */}
        <View style={styles.roleToggleContainer}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'player' && styles.roleTabActive]}
            onPress={() => setRole('player')}
          >
            <Ionicons
              name="person"
              size={16}
              color={role === 'player' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text style={[styles.roleTabText, role === 'player' && styles.roleTabTextActive]}>
              Player Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, role === 'coach' && styles.roleTabActive]}
            onPress={() => setRole('coach')}
          >
            <Ionicons
              name="shield-checkmark"
              size={16}
              color={role === 'coach' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text style={[styles.roleTabText, role === 'coach' && styles.roleTabTextActive]}>
              Coach / Scout Account
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
              placeholder="e.g. Sunil Chhetri Jr"
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
              placeholder="player@scoutx.com"
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
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          {/* Location Row */}
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
              <Text style={styles.inputLabel}>City / District</Text>
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

          {/* PLAYER SPECIFIC INPUTS */}
          {role === 'player' && (
            <>
              <Text style={styles.sectionHeader}>⚽ Football Details</Text>

              <Text style={styles.inputLabel}>Playing Position</Text>
              <View style={styles.chipsContainer}>
                {FOOTBALL_POSITIONS.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.chip, position === pos && styles.chipActive]}
                    onPress={() => setPosition(pos)}
                  >
                    <Text style={[styles.chipText, position === pos && styles.chipTextActive]}>
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Preferred Foot</Text>
              <View style={styles.chipsContainer}>
                {PREFERRED_FEET.map((foot) => (
                  <TouchableOpacity
                    key={foot}
                    style={[styles.chip, preferredFoot === foot && styles.chipActive]}
                    onPress={() => setPreferredFoot(foot)}
                  >
                    <Text style={[styles.chipText, preferredFoot === foot && styles.chipTextActive]}>
                      {foot} Foot
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="17"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={age}
                      onChangeText={setAge}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Current Club / Academy</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="FC Pune Youth"
                      placeholderTextColor="#64748B"
                      value={clubOrTeam}
                      onChangeText={setClubOrTeam}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* COACH SPECIFIC INPUTS */}
          {role === 'coach' && (
            <>
              <Text style={styles.sectionHeader}>🛡️ Scout & Coaching Credentials</Text>

              <Text style={styles.inputLabel}>Club / Scouting Organization</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mumbai City FC Scouts"
                  placeholderTextColor="#64748B"
                  value={clubOrAcademy}
                  onChangeText={setClubOrAcademy}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>License Level</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="AFC B License"
                      placeholderTextColor="#64748B"
                      value={licenseLevel}
                      onChangeText={setLicenseLevel}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Experience (Yrs)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="5"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={experienceYears}
                      onChangeText={setExperienceYears}
                    />
                  </View>
                </View>
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
                Complete {role === 'player' ? 'Player' : 'Coach'} Registration 🚀
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
    paddingTop: 12,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  headerSub: {
    fontSize: 12,
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
    backgroundColor: '#10B981',
  },
  roleTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 6,
  },
  form: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
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
    fontSize: 14,
  },
  eyeButton: {
    padding: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
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
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
});
