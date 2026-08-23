import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_API_URL } from '../services/apiConfig';

export default function HomeScreen({ route, navigation }) {
  const {
    userRole = 'athlete',
    userName = 'Athlete',
    userEmail = 'athlete@scoutx.com',
    userState = 'Maharashtra',
    userDistrict = 'Pune',
    userSport = 'Athletics',
    athleteId = 'SAI-482910',
  } = route.params || {};

  const [activeTab, setActiveTab] = useState(userRole);
  const [leaderboard, setLeaderboard] = useState([]);
  const [filterSport, setFilterSport] = useState('');

  // 1. Fetch live registered athletes for Scout Discovery View
  useEffect(() => {
    fetchLeaderboard();
  }, [filterSport]);

  const fetchLeaderboard = async () => {
    try {
      const url = filterSport
        ? `${BASE_API_URL}/scouts/leaderboard?sport=${filterSport}`
        : `${BASE_API_URL}/scouts/leaderboard`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok && data.data) {
        setLeaderboard(data.data);
      } else {
        // Default sample leaderboard for demo
        setLeaderboard([
          {
            rank: 1,
            athleteId: 'SAI-921840',
            name: 'Neeraj Kumar',
            state: 'Haryana',
            sport: 'Athletics',
            overallScore: 94,
            nationalPercentile: 98.6,
          },
          {
            rank: 2,
            athleteId: 'SAI-482910',
            name: userName,
            state: userState,
            sport: userSport,
            overallScore: 88,
            nationalPercentile: 92.4,
          },
          {
            rank: 3,
            athleteId: 'SAI-710293',
            name: 'Pooja Patil',
            state: 'Maharashtra',
            sport: 'Football',
            overallScore: 82,
            nationalPercentile: 86.1,
          },
        ]);
      }
    } catch (error) {
      setLeaderboard([
        {
          rank: 1,
          athleteId: 'SAI-921840',
          name: 'Neeraj Kumar',
          state: 'Haryana',
          sport: 'Athletics',
          overallScore: 94,
          nationalPercentile: 98.6,
        },
        {
          rank: 2,
          athleteId: 'SAI-482910',
          name: userName,
          state: userState,
          sport: userSport,
          overallScore: 88,
          nationalPercentile: 92.4,
        },
      ]);
    }
  };

  const drills = [
    {
      id: 'squat',
      title: 'Squat Form & Endurance',
      category: 'Lower Body Strength',
      icon: 'human-handsdown',
      metrics: 'Reps, 90° Depth, Back Posture',
      saiBenchmark: 'Standard: 35+ reps / min',
      color: '#4F46E5',
    },
    {
      id: 'pushup',
      title: 'Push-Up Muscular Test',
      category: 'Upper Body Endurance',
      icon: 'arm-flex',
      metrics: 'Valid Reps, Chest Depth, Hip Line',
      saiBenchmark: 'Standard: 30+ reps / min',
      color: '#059669',
    },
    {
      id: 'jump',
      title: 'Vertical Jump Assessment',
      category: 'Explosive Leg Power',
      icon: 'arrow-up-bold-box',
      metrics: 'Jump Height (cm), Flight Time (ms)',
      saiBenchmark: 'National Top 10%: > 55 cm',
      color: '#DC2626',
    },
  ];

  const handleDrillPress = (drill) => {
    Alert.alert(
      drill.title,
      `🎯 Category: ${drill.category}\n📊 Target: ${drill.saiBenchmark}\n📏 AI Metrics: ${drill.metrics}\n\nTo test this drill live on your webcam, run:\npython analyze_drill.py --drill ${drill.id} --webcam`
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => navigation.replace('Login'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Hello, {userName}! 🏃</Text>
            <Text style={styles.roleSubhead}>
              {activeTab === 'athlete' ? `Athlete ID: ${athleteId}` : 'National Talent Scout Portal'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* View Toggle */}
        <View style={styles.toggleBar}>
          <TouchableOpacity
            style={[
              styles.toggleTab,
              activeTab === 'athlete' && styles.toggleTabActive,
            ]}
            onPress={() => setActiveTab('athlete')}
          >
            <Ionicons
              name="fitness-outline"
              size={18}
              color={activeTab === 'athlete' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text
              style={[
                styles.toggleText,
                activeTab === 'athlete' && styles.toggleTextActive,
              ]}
            >
              My Athlete Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleTab,
              activeTab === 'scout' && styles.toggleTabActive,
            ]}
            onPress={() => setActiveTab('scout')}
          >
            <Ionicons
              name="trophy-outline"
              size={18}
              color={activeTab === 'scout' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text
              style={[
                styles.toggleText,
                activeTab === 'scout' && styles.toggleTextActive,
              ]}
            >
              Scout Discovery Grid
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic View Content */}
        {activeTab === 'athlete' ? (
          <>
            {/* Athlete Profile Card */}
            <View style={styles.profileBadgeCard}>
              <View style={styles.badgeRow}>
                <View>
                  <Text style={styles.profileName}>{userName}</Text>
                  <Text style={styles.profileLocation}>📍 {userDistrict}, {userState} • {userSport}</Text>
                  <Text style={styles.profileEmail}>✉️ {userEmail}</Text>
                </View>
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedText}>SAI VERIFIED</Text>
                </View>
              </View>

              {/* Khelo India 5-Axis Radar Stats */}
              <View style={styles.radarStatsGrid}>
                <View style={styles.radarStatBox}>
                  <Text style={styles.radarStatLabel}>POWER</Text>
                  <Text style={styles.radarStatVal}>85</Text>
                </View>
                <View style={styles.radarStatBox}>
                  <Text style={styles.radarStatLabel}>ENDURANCE</Text>
                  <Text style={styles.radarStatVal}>82</Text>
                </View>
                <View style={styles.radarStatBox}>
                  <Text style={styles.radarStatLabel}>STRENGTH</Text>
                  <Text style={styles.radarStatVal}>88</Text>
                </View>
                <View style={styles.radarStatBox}>
                  <Text style={styles.radarStatLabel}>PERCENTILE</Text>
                  <Text style={[styles.radarStatVal, { color: '#10B981' }]}>Top 8%</Text>
                </View>
              </View>
            </View>

            {/* Drills Section */}
            <Text style={styles.sectionTitle}>Available AI Assessment Drills</Text>

            {drills.map((drill) => (
              <TouchableOpacity
                key={drill.id}
                style={styles.drillCard}
                activeOpacity={0.8}
                onPress={() => handleDrillPress(drill)}
              >
                <View style={[styles.iconBox, { backgroundColor: drill.color }]}>
                  <MaterialCommunityIcons name={drill.icon} size={28} color="#FFFFFF" />
                </View>

                <View style={styles.drillDetails}>
                  <Text style={styles.drillCategory}>{drill.category.toUpperCase()}</Text>
                  <Text style={styles.drillTitle}>{drill.title}</Text>
                  <Text style={styles.drillBenchmark}>{drill.saiBenchmark}</Text>
                </View>

                <View style={styles.arrowBox}>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            {/* Scout Leaderboard View */}
            <View style={styles.bannerCard}>
              <Text style={styles.bannerTitle}>National Talent Discovery Grid 🔍</Text>
              <Text style={styles.bannerBody}>
                All athlete registrations from the database are ranked below based on their AI sports radar scores.
              </Text>
            </View>

            {/* Filter */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Filter by sport (e.g. Athletics / Football)..."
                placeholderTextColor="#64748B"
                value={filterSport}
                onChangeText={setFilterSport}
              />
            </View>

            <Text style={styles.sectionTitle}>Top Ranked Grassroots Athletes</Text>

            {leaderboard.map((ath) => (
              <View key={ath.athleteId} style={styles.scoutCard}>
                <View style={styles.rankCircle}>
                  <Text style={styles.rankText}>#{ath.rank}</Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.scoutAthName}>{ath.name}</Text>
                  <Text style={styles.scoutAthSub}>{ath.sport} • {ath.state} ({ath.athleteId})</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.scoutScore}>{ath.overallScore} / 100</Text>
                  <Text style={styles.scoutPercentile}>{ath.nationalPercentile}th %ile</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Footer info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            ScoutX AI • SIH25073 • AI-Powered Sports Talent Assessment Platform
          </Text>
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
    padding: 20,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  roleSubhead: {
    fontSize: 13,
    color: '#38BDF8',
    marginTop: 2,
    fontWeight: '600',
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  toggleTabActive: {
    backgroundColor: '#3B82F6',
  },
  toggleText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  profileBadgeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  profileLocation: {
    fontSize: 13,
    color: '#38BDF8',
    marginTop: 3,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  verifiedTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  radarStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  radarStatBox: {
    alignItems: 'center',
  },
  radarStatLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  radarStatVal: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  bannerCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
  },
  bannerTitle: {
    color: '#E0E7FF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerBody: {
    color: '#C7D2FE',
    fontSize: 12,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  scoutCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  scoutAthName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  scoutAthSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  scoutScore: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '800',
  },
  scoutPercentile: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  drillCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  drillDetails: {
    flex: 1,
  },
  drillCategory: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  drillTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  drillBenchmark: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  arrowBox: {
    paddingLeft: 8,
  },
  footerInfo: {
    marginTop: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
  },
});
