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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_API_URL } from '../services/apiConfig';

const POSITION_FILTERS = ['All', 'Striker', 'Winger', 'Midfielder', 'Defender', 'Goalkeeper'];
const FOOT_FILTERS = ['All', 'Right', 'Left', 'Both'];

export default function HomeScreen({ route, navigation }) {
  const {
    userRole = 'player',
    userName = 'Sunil Chhetri Jr',
    userEmail = 'player@scoutx.com',
    userToken,
    userLocation = { state: 'Karnataka', district: 'Bengaluru', city: 'Bengaluru' },
    playerProfile: initialProfile,
  } = route.params || {};

  const [activeTab, setActiveTab] = useState(userRole === 'coach' ? 'scout' : 'player');
  const [profile, setProfile] = useState(
    initialProfile || {
      playerId: 'FB-882104',
      position: 'Striker',
      preferredFoot: 'Right',
      clubOrTeam: 'Bengaluru Youth FC',
      overallScore: 89.5,
      dribblingScore: 91.0,
      shootingScore: 92.5,
      ballControlScore: 86.0,
      shotAccuracy: 88.0,
      estimatedPower: 85.0,
      nationalPercentile: 96.4,
      assessmentCount: 4,
    }
  );

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingScout, setLoadingScout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosFilter, setSelectedPosFilter] = useState('All');
  const [selectedFootFilter, setSelectedFootFilter] = useState('All');

  // Fetch updated profile stats on load
  useEffect(() => {
    fetchLiveStats();
  }, []);

  // Fetch coach discovery list on filter change
  useEffect(() => {
    fetchScoutPlayers();
  }, [searchQuery, selectedPosFilter, selectedFootFilter]);

  const fetchLiveStats = async () => {
    if (!userToken) return;
    try {
      const response = await fetch(`${BASE_API_URL}/players/stats`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setProfile((prev) => {
          const updated = {
            ...prev,
            overallScore: data.data.overallScore || prev.overallScore,
            nationalPercentile: data.data.nationalPercentile || prev.nationalPercentile,
            assessmentCount: data.data.assessmentCount || prev.assessmentCount,
          };
          if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
            try {
              const current = JSON.parse(localStorage.getItem('scoutx_user_session') || '{}');
              localStorage.setItem(
                'scoutx_user_session',
                JSON.stringify({ ...current, playerProfile: updated })
              );
            } catch (e) {}
          }
          return updated;
        });
      }
    } catch (e) {
      console.warn(`[Stats Sync]: ${e.message}`);
    }
  };

  const fetchScoutPlayers = async () => {
    setLoadingScout(true);
    try {
      let url = `${BASE_API_URL}/scouts/players?`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (selectedPosFilter !== 'All') url += `position=${encodeURIComponent(selectedPosFilter)}&`;
      if (selectedFootFilter !== 'All') url += `preferredFoot=${encodeURIComponent(selectedFootFilter)}&`;

      const response = await fetch(url, {
        headers: {
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
      });
      const data = await response.json();
      if (response.ok && data.data && data.data.length > 0) {
        const mapped = data.data.map((p, idx) => ({
          rank: idx + 1,
          athleteId: p.playerId || `FB-${p._id?.slice(-6)}`,
          _id: p.user?._id || p._id,
          name: p.user?.name || 'Football Prospect',
          state: p.user?.location?.state || 'Maharashtra',
          city: p.user?.location?.city || 'Pune',
          sport: p.position || 'Striker',
          preferredFoot: p.preferredFoot || 'Right',
          overallScore: Math.round(p.overallScore || 80),
          dribbling: Math.round(p.dribblingScore || 78),
          shooting: Math.round(p.shootingScore || 76),
          ballControl: Math.round(p.ballControlScore || 80),
          nationalPercentile: p.nationalPercentile || 85,
        }));
        setLeaderboard(mapped);
      } else {
        setDefaultLeaderboard();
      }
    } catch (error) {
      setDefaultLeaderboard();
    } finally {
      setLoadingScout(false);
    }
  };

  const setDefaultLeaderboard = () => {
    setLeaderboard([
      {
        rank: 1,
        athleteId: 'FB-882104',
        _id: 'usr_player_01',
        name: 'Sunil Chhetri Jr',
        state: 'Karnataka',
        city: 'Bengaluru',
        sport: 'Striker',
        overallScore: 90,
        nationalPercentile: 96.4,
        preferredFoot: 'Right',
        dribbling: 91,
        shooting: 93,
        ballControl: 86,
      },
      {
        rank: 2,
        athleteId: 'FB-519203',
        _id: 'usr_player_02',
        name: 'Lallianzuala Changte Jr',
        state: 'Mizoram',
        city: 'Aizawl',
        sport: 'Winger',
        overallScore: 87,
        nationalPercentile: 93.8,
        preferredFoot: 'Left',
        dribbling: 94,
        shooting: 82,
        ballControl: 89,
      },
      {
        rank: 3,
        athleteId: 'FB-482910',
        _id: 'usr_player_03',
        name: 'Sahal Abdul Samad Jr',
        state: 'Kerala',
        city: 'Kochi',
        sport: 'Midfielder',
        overallScore: 85,
        nationalPercentile: 91.2,
        preferredFoot: 'Both',
        dribbling: 88,
        shooting: 84,
        ballControl: 92,
      },
    ]);
  };

  // 3 Official Football Assessment Drills
  const footballDrills = [
    {
      id: 'dribbling',
      title: 'Slalom & Cone Dribbling',
      category: 'Agility & Close Control',
      icon: 'soccer',
      metrics: 'Ball Touches, Directional Cuts, Proximity Index',
      targetBench: 'Pro Benchmark: < 12.5s clean slalom run',
      color: '#10B981',
    },
    {
      id: 'shooting',
      title: 'Target Shooting Drill',
      category: 'Finishing & Shot Power',
      icon: 'crosshairs-gps',
      metrics: 'On-Target %, Goal Detection, Estimated Shot Power',
      targetBench: 'Pro Standard: > 75% on Target',
      color: '#3B82F6',
    },
    {
      id: 'ball_control',
      title: 'First Touch & Juggling',
      category: 'Ball Mastery & Foot Balance',
      icon: 'transit-connection-variant',
      metrics: 'Consecutive Touches, Left vs Right Foot Balance',
      targetBench: 'Mastery: > 40 Controlled Touches',
      color: '#F59E0B',
    },
  ];

  const handleDrillSelect = (drill) => {
    navigation.navigate('RecordUpload', {
      initialDrill: drill.id,
      userToken,
    });
  };

  const handleOpenMessages = (recipient = null) => {
    navigation.navigate('Messages', {
      userToken,
      userName,
      recipientUser: recipient,
    });
  };

  const handleShortlist = async (player) => {
    try {
      await fetch(`${BASE_API_URL}/scouts/shortlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
        body: JSON.stringify({ playerId: player._id || player.athleteId }),
      });
      Alert.alert('Player Shortlisted 📋', `${player.name} added to your scouting shortlist.`);
    } catch (e) {
      Alert.alert('Shortlisted 📋', `${player.name} added to your scouting shortlist.`);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('scoutx_user_session');
      } catch (e) {}
    }
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <View style={styles.appTitleRow}>
              <Ionicons name="football" size={20} color="#10B981" />
              <Text style={styles.appTitle}>ScoutX Football</Text>
            </View>
            <Text style={styles.greeting}>Hello, {userName}!</Text>
            <Text style={styles.roleSubhead}>
              {activeTab === 'player'
                ? `${profile?.position || 'Striker'} • ${profile?.preferredFoot || 'Right'} Foot • ${userLocation?.city || 'Pune'}`
                : 'National Football Scout Portal 🔍'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Direct Message Icon */}
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpenMessages()}>
              <Ionicons name="chatbubbles-outline" size={20} color="#10B981" />
            </TouchableOpacity>

            {/* Logout / Return to Login Button */}
            <TouchableOpacity
              style={styles.logoutBtn}
              activeOpacity={0.8}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={16} color="#EF4444" />
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* View Switcher Tabs */}
        <View style={styles.toggleBar}>
          <TouchableOpacity
            style={[styles.toggleTab, activeTab === 'player' && styles.toggleTabActive]}
            onPress={() => setActiveTab('player')}
          >
            <Ionicons
              name="person-outline"
              size={16}
              color={activeTab === 'player' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text style={[styles.toggleText, activeTab === 'player' && styles.toggleTextActive]}>
              Player Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleTab, activeTab === 'scout' && styles.toggleTabActive]}
            onPress={() => setActiveTab('scout')}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={activeTab === 'scout' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text style={[styles.toggleText, activeTab === 'scout' && styles.toggleTextActive]}>
              Scout Discovery Grid
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* PLAYER VIEW */}
        {/* ======================================================== */}
        {activeTab === 'player' ? (
          <>
            {/* Player Main Football Card */}
            <View style={styles.playerCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.playerName}>{userName}</Text>
                  <Text style={styles.playerClub}>
                    🏟️ {profile?.clubOrTeam || 'Grassroots Academy'} • {userLocation?.city || 'Pune'}
                  </Text>
                  <Text style={styles.playerIdTag}>ID: {profile?.playerId || 'FB-882104'}</Text>
                </View>
                <View style={styles.overallScoreCircle}>
                  <Text style={styles.overallScoreNum}>
                    {Math.round(profile?.overallScore || 89)}
                  </Text>
                  <Text style={styles.overallScoreLabel}>OVERALL</Text>
                </View>
              </View>

              {/* Technical Football Metric Badges */}
              <View style={styles.technicalMetricsGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>DRIBBLING</Text>
                  <Text style={[styles.metricVal, { color: '#10B981' }]}>
                    {profile?.dribblingScore || 91}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>SHOOTING</Text>
                  <Text style={[styles.metricVal, { color: '#3B82F6' }]}>
                    {profile?.shootingScore || 93}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>CONTROL</Text>
                  <Text style={[styles.metricVal, { color: '#F59E0B' }]}>
                    {profile?.ballControlScore || 86}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>PERCENTILE</Text>
                  <Text style={[styles.metricVal, { color: '#8B5CF6' }]}>
                    Top {Math.max(1, 100 - Math.round(profile?.nationalPercentile || 96))}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Achievements Section */}
            <View style={styles.achievementsCard}>
              <View style={styles.achieveHeader}>
                <Ionicons name="medal-outline" size={18} color="#F59E0B" />
                <Text style={styles.achieveTitle}>Verified Football Badges</Text>
              </View>
              <View style={styles.badgeChipsRow}>
                <View style={styles.achieveBadge}>
                  <Text style={styles.achieveBadgeText}>🎯 AI 90+ Shooting Accuracy</Text>
                </View>
                <View style={[styles.achieveBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={[styles.achieveBadgeText, { color: '#10B981' }]}>⚡ Sub-Second Dribbler</Text>
                </View>
                <View style={[styles.achieveBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Text style={[styles.achieveBadgeText, { color: '#3B82F6' }]}>🤹 First Touch Master</Text>
                </View>
              </View>
            </View>

            {/* AI Football Drills Section */}
            <Text style={styles.sectionTitle}>⚽ Football Assessment Drills</Text>

            {footballDrills.map((drill) => (
              <TouchableOpacity
                key={drill.id}
                style={styles.drillCard}
                activeOpacity={0.85}
                onPress={() => handleDrillSelect(drill)}
              >
                <View style={[styles.drillIconBox, { backgroundColor: drill.color }]}>
                  <MaterialCommunityIcons name={drill.icon} size={28} color="#FFFFFF" />
                </View>

                <View style={styles.drillInfo}>
                  <Text style={styles.drillCategory}>{drill.category.toUpperCase()}</Text>
                  <Text style={styles.drillTitle}>{drill.title}</Text>
                  <Text style={styles.drillBench}>{drill.metrics}</Text>
                </View>

                <View style={styles.arrowIconBox}>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          /* ======================================================== */
          /* COACH / SCOUT DISCOVERY VIEW */
          /* ======================================================== */
          <>
            <View style={styles.scoutBanner}>
              <Text style={styles.scoutBannerTitle}>National Football Talent Discovery 🔍</Text>
              <Text style={styles.scoutBannerSub}>
                Search and filter grassroots talent by position, preferred foot, and AI performance metrics.
              </Text>
            </View>

            {/* Search Input Bar */}
            <View style={styles.filterBar}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.filterInput}
                placeholder="Search player name, academy, or state..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Position Filter Chips */}
            <Text style={styles.filterLabel}>Filter by Position:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {POSITION_FILTERS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  style={[styles.filterChip, selectedPosFilter === pos && styles.filterChipActive]}
                  onPress={() => setSelectedPosFilter(pos)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedPosFilter === pos && styles.filterChipTextActive,
                    ]}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Preferred Foot Filter Chips */}
            <Text style={styles.filterLabel}>Preferred Foot:</Text>
            <View style={styles.footChipsRow}>
              {FOOT_FILTERS.map((foot) => (
                <TouchableOpacity
                  key={foot}
                  style={[styles.filterChip, selectedFootFilter === foot && styles.filterChipActive]}
                  onPress={() => setSelectedFootFilter(foot)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFootFilter === foot && styles.filterChipTextActive,
                    ]}
                  >
                    {foot === 'All' ? 'All Feet' : `${foot} Foot`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Leaderboard Prospects */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 }}>
              <Text style={styles.sectionTitle}>Prospects ({leaderboard.length})</Text>
              {loadingScout && <ActivityIndicator size="small" color="#10B981" />}
            </View>

            {leaderboard.map((player) => (
              <View key={player.athleteId || player._id} style={styles.scoutPlayerCard}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNum}>#{player.rank}</Text>
                </View>

                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <Text style={styles.scoutPlayerName}>{player.name}</Text>
                  <Text style={styles.scoutPlayerSub}>
                    {player.sport} • {player.preferredFoot} Foot • {player.state}
                  </Text>
                  <Text style={styles.scoutSubScores}>
                    Dribbling: {player.dribbling} | Shooting: {player.shooting} | Control: {player.ballControl}
                  </Text>

                  {/* Coach Actions */}
                  <View style={styles.scoutActionRow}>
                    <TouchableOpacity
                      style={styles.messagePlayerBtn}
                      onPress={() => handleOpenMessages(player)}
                    >
                      <Ionicons name="chatbubble-ellipses" size={14} color="#10B981" />
                      <Text style={styles.messagePlayerBtnText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.shortlistBtn}
                      onPress={() => handleShortlist(player)}
                    >
                      <Ionicons name="star-outline" size={14} color="#F59E0B" />
                      <Text style={styles.shortlistBtnText}>Shortlist</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.scoutOverall}>{player.overallScore}</Text>
                  <Text style={styles.scoutPercentile}>
                    Top {Math.max(1, 100 - Math.round(player.nationalPercentile || 90))}%
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Footer */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            ScoutX AI • Democratizing Football Talent Assessment • MediaPipe + YOLO
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
  appTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  appTitle: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  roleSubhead: {
    fontSize: 13,
    color: '#38BDF8',
    marginTop: 2,
    fontWeight: '600',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    gap: 5,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
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
    gap: 6,
  },
  toggleTabActive: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  playerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  playerClub: {
    fontSize: 13,
    color: '#38BDF8',
    marginTop: 3,
    fontWeight: '600',
  },
  playerIdTag: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  overallScoreCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  overallScoreNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10B981',
  },
  overallScoreLabel: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '800',
  },
  technicalMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  metricBox: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 3,
  },
  achievementsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  achieveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  achieveTitle: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
  },
  badgeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achieveBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  achieveBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
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
  drillIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  drillInfo: {
    flex: 1,
  },
  drillCategory: {
    color: '#10B981',
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
  drillBench: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  arrowIconBox: {
    paddingLeft: 8,
  },
  scoutBanner: {
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  scoutBannerTitle: {
    color: '#E0E7FF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  scoutBannerSub: {
    color: '#C7D2FE',
    fontSize: 12,
    lineHeight: 18,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  filterLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  chipsScroll: {
    marginBottom: 14,
  },
  footChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scoutPlayerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNum: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  scoutPlayerName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  scoutPlayerSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  scoutSubScores: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  scoutActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  messagePlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  messagePlayerBtnText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  shortlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  shortlistBtnText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  scoutOverall: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
  },
  scoutPercentile: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  footerInfo: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
  },
});
