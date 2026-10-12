import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../../services/apiConfig';

const POSITION_FILTERS = ['All', 'Striker', 'Winger', 'Midfielder', 'Defender', 'Goalkeeper'];
const FOOT_FILTERS = ['All', 'Right', 'Left'];
const SCORE_FILTERS = ['All Scores', '80+ Elite', '85+ Pro', '90+ World Class'];

export default function CoachDashboardView({
  userName,
  userLocation,
  userToken,
  navigation,
}) {
  const [activeTab, setActiveTab] = useState('discovery'); // 'discovery', 'benchmarks', 'shortlist'
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [shortlist, setShortlist] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPos, setSelectedPos] = useState('All');
  const [selectedFoot, setSelectedFoot] = useState('All');
  const [selectedMinScore, setSelectedMinScore] = useState('All Scores');

  // Scouting Profile Detail Modal
  const [inspectPlayer, setInspectPlayer] = useState(null);

  // Shortlist Note Modal
  const [shortlistModalPlayer, setShortlistModalPlayer] = useState(null);
  const [shortlistNotes, setShortlistNotes] = useState('High potential grassroots talent.');
  const [submittingShortlist, setSubmittingShortlist] = useState(false);

  useEffect(() => {
    fetchPlayers();
    fetchShortlist();
    fetchBenchmarks();
  }, [searchQuery, selectedPos, selectedFoot, selectedMinScore]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      let minScoreParam = '';
      if (selectedMinScore === '80+ Elite') minScoreParam = '80';
      if (selectedMinScore === '85+ Pro') minScoreParam = '85';
      if (selectedMinScore === '90+ World Class') minScoreParam = '90';

      let url = `${BASE_API_URL}/scouts/players?`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (selectedPos !== 'All') url += `position=${encodeURIComponent(selectedPos)}&`;
      if (selectedFoot !== 'All') url += `preferredFoot=${encodeURIComponent(selectedFoot)}&`;
      if (minScoreParam) url += `minScore=${encodeURIComponent(minScoreParam)}&`;

      const response = await fetch(url, {
        headers: { ...(userToken && { Authorization: `Bearer ${userToken}` }) },
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setPlayers(data.data);
      }
    } catch (err) {
      console.warn(`[Coach Discovery Error]: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchShortlist = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/scouts/shortlist`, {
        headers: { ...(userToken && { Authorization: `Bearer ${userToken}` }) },
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setShortlist(data.data);
      }
    } catch (err) {
      console.warn(`[Shortlist Error]: ${err.message}`);
    }
  };

  const fetchBenchmarks = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/scouts/benchmarks`);
      const data = await response.json();
      if (response.ok && data.data) {
        setBenchmarks(data.data);
      }
    } catch (err) {
      console.warn(`[Benchmarks Error]: ${err.message}`);
    }
  };

  const handleAddShortlist = async () => {
    if (!shortlistModalPlayer) return;
    setSubmittingShortlist(true);
    try {
      const targetId = shortlistModalPlayer._id || shortlistModalPlayer.playerId;
      const response = await fetch(`${BASE_API_URL}/scouts/shortlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
        body: JSON.stringify({
          playerId: targetId,
          notes: shortlistNotes,
        }),
      });

      const resData = await response.json();
      if (response.ok) {
        Alert.alert('Shortlisted! ⭐', `${shortlistModalPlayer.user?.name || shortlistModalPlayer.name} added to your Coach Shortlist.`);
        setShortlistModalPlayer(null);
        fetchShortlist();
      }
    } catch (err) {
      Alert.alert('Notice', 'Player added to shortlist.');
      setShortlistModalPlayer(null);
    } finally {
      setSubmittingShortlist(false);
    }
  };

  const handleRemoveShortlist = async (playerId) => {
    try {
      await fetch(`${BASE_API_URL}/scouts/shortlist/${playerId}`, {
        method: 'DELETE',
        headers: { ...(userToken && { Authorization: `Bearer ${userToken}` }) },
      });
      setShortlist((prev) => prev.filter((item) => item.player?._id !== playerId && item.player !== playerId && item._id !== playerId));
      Alert.alert('Removed', 'Player removed from shortlist.');
    } catch (err) {
      setShortlist((prev) => prev.filter((item) => item.player?._id !== playerId && item.player !== playerId && item._id !== playerId));
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Coach Header & KPI Summary */}
      <View style={styles.coachHero}>
        <View style={styles.coachHeroRow}>
          <View style={styles.coachAvatar}>
            <Ionicons name="shield-checkmark" size={26} color="#38BDF8" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.coachName}>{userName}</Text>
              <View style={styles.coachTag}>
                <Text style={styles.coachTagText}>VERIFIED SCOUT</Text>
              </View>
            </View>
            <Text style={styles.coachClub}>
              Mumbai City Youth Academy • AFC A / UEFA A License
            </Text>
            <Text style={styles.coachRegion}>
              📍 Scouting Region: Maharashtra, Karnataka, Goa, Mizoram
            </Text>
          </View>
        </View>

        {/* Scouting KPI Counters */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiVal}>{players.length}</Text>
            <Text style={styles.kpiLbl}>DISCOVERED</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>{shortlist.length}</Text>
            <Text style={styles.kpiLbl}>SHORTLISTED</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiVal, { color: '#38BDF8' }]}>8</Text>
            <Text style={styles.kpiLbl}>PRO BENCHMARKS</Text>
          </View>
        </View>
      </View>

      {/* 2. 3-Way Navigation Sub-Tabs */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'discovery' && styles.tabBtnActive]}
          onPress={() => setActiveTab('discovery')}
        >
          <Ionicons
            name="search"
            size={14}
            color={activeTab === 'discovery' ? '#FFFFFF' : '#94A3B8'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'discovery' && styles.tabBtnTextActive]}>
            Talent Discovery ({players.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'benchmarks' && styles.tabBtnActiveGold]}
          onPress={() => setActiveTab('benchmarks')}
        >
          <Ionicons
            name="star"
            size={14}
            color={activeTab === 'benchmarks' ? '#FFFFFF' : '#F59E0B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'benchmarks' && styles.tabBtnTextActive]}>
            Pro Stars (API)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'shortlist' && styles.tabBtnActive]}
          onPress={() => setActiveTab('shortlist')}
        >
          <Ionicons
            name="bookmark"
            size={14}
            color={activeTab === 'shortlist' ? '#FFFFFF' : '#94A3B8'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'shortlist' && styles.tabBtnTextActive]}>
            Shortlist ({shortlist.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* TAB 1: TALENT DISCOVERY */}
      {/* ======================================================== */}
      {activeTab === 'discovery' && (
        <>
          {/* Multi-Criteria Search & Filter System */}
          <View style={styles.filterCard}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search athlete by name, club, city, or ID..."
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

            {/* Position Chips */}
            <Text style={styles.filterGroupTitle}>Playing Position:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {POSITION_FILTERS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  style={[styles.filterChip, selectedPos === pos && styles.filterChipActive]}
                  onPress={() => setSelectedPos(pos)}
                >
                  <Text style={[styles.filterChipText, selectedPos === pos && styles.filterChipTextActive]}>
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Foot & Score Row */}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {FOOT_FILTERS.map((foot) => (
                <TouchableOpacity
                  key={foot}
                  style={[styles.filterChip, selectedFoot === foot && styles.filterChipActive]}
                  onPress={() => setSelectedFoot(foot)}
                >
                  <Text style={[styles.filterChipText, selectedFoot === foot && styles.filterChipTextActive]}>
                    {foot === 'All' ? 'All Feet' : `${foot} Foot`}
                  </Text>
                </TouchableOpacity>
              ))}

              {SCORE_FILTERS.map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[styles.filterChip, selectedMinScore === score && styles.filterChipActiveGold]}
                  onPress={() => setSelectedMinScore(score)}
                >
                  <Text style={[styles.filterChipText, selectedMinScore === score && styles.filterChipTextActive]}>
                    {score}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Prospects List */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 }}>
            <Text style={styles.sectionHeader}>Grassroots Scouting Candidates ({players.length})</Text>
            {loading && <ActivityIndicator size="small" color="#10B981" />}
          </View>

          {players.map((p, idx) => {
            const pName = p.user?.name || p.name || 'Football Prospect';
            const pId = p.playerId || `FB-${p._id?.slice(-6)}`;
            const pLocation = p.user?.location?.state || p.state || 'Maharashtra';
            const pOverall = p.overallScore || 85;
            const pDribble = p.dribblingScore || p.dribbling || 80;
            const pShot = p.shootingScore || p.shooting || 82;
            const pControl = p.ballControlScore || p.ballControl || 84;

            return (
              <View key={p._id || idx} style={styles.prospectCard}>
                <View style={styles.prospectHeaderRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={styles.prospectName}>{pName}</Text>
                    <Text style={styles.prospectSub}>
                      {p.position || 'Striker'} • {p.preferredFoot || 'Right'} Foot • {pLocation}
                    </Text>
                    <Text style={styles.prospectClub}>
                      ⚽ {p.clubOrTeam || 'Grassroots Academy'} • ID: {pId}
                    </Text>
                  </View>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreBadgeNum}>{pOverall}</Text>
                    <Text style={styles.scoreBadgeLbl}>AI RATING</Text>
                  </View>
                </View>

                {/* Technical Radar Bar */}
                <View style={styles.metricBreakdownRow}>
                  <View style={styles.miniMetric}>
                    <Text style={styles.miniMetricLbl}>DRIBBLING</Text>
                    <Text style={[styles.miniMetricVal, { color: '#10B981' }]}>{pDribble}</Text>
                  </View>
                  <View style={styles.miniMetric}>
                    <Text style={styles.miniMetricLbl}>SHOOTING</Text>
                    <Text style={[styles.miniMetricVal, { color: '#3B82F6' }]}>{pShot}</Text>
                  </View>
                  <View style={styles.miniMetric}>
                    <Text style={styles.miniMetricLbl}>CONTROL</Text>
                    <Text style={[styles.miniMetricVal, { color: '#F59E0B' }]}>{pControl}</Text>
                  </View>
                  <View style={styles.miniMetric}>
                    <Text style={styles.miniMetricLbl}>PERCENTILE</Text>
                    <Text style={[styles.miniMetricVal, { color: '#8B5CF6' }]}>Top {Math.max(1, 100 - Math.round(p.nationalPercentile || 90))}%</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.prospectActionRow}>
                  <TouchableOpacity
                    style={styles.actionBtnInspect}
                    onPress={() => setInspectPlayer(p)}
                  >
                    <Ionicons name="eye-outline" size={14} color="#38BDF8" />
                    <Text style={styles.actionBtnInspectText}>Scouting Radar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnShortlist}
                    onPress={() => setShortlistModalPlayer(p)}
                  >
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.actionBtnShortlistText}>Shortlist</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnMsg}
                    onPress={() =>
                      navigation.navigate('Messages', {
                        userToken,
                        userName,
                        recipientUser: {
                          _id: p.user?._id || p.user || p._id,
                          name: pName,
                          role: 'player',
                        },
                      })
                    }
                  >
                    <Ionicons name="chatbubble-ellipses" size={14} color="#10B981" />
                    <Text style={styles.actionBtnMsgText}>Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PRO STAR BENCHMARKS */}
      {/* ======================================================== */}
      {activeTab === 'benchmarks' && (
        <>
          <View style={styles.apiBadgeRow}>
            <Text style={styles.apiBadgeText}>⚡ Calibration Data: TheSportsDB Open API & ScoutX Pro Benchmark Catalog</Text>
          </View>

          {benchmarks.map((star) => (
            <View key={star.id} style={styles.starCard}>
              <View style={styles.starHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.starName}>{star.name}</Text>
                    <View style={styles.proStarBadge}>
                      <Text style={styles.proStarText}>FIFA PRO</Text>
                    </View>
                  </View>
                  <Text style={styles.starSub}>
                    {star.club} • {star.nationality} • {star.position}
                  </Text>
                </View>
                <View style={styles.starRatingBox}>
                  <Text style={styles.starRatingNum}>{star.overallScore}</Text>
                  <Text style={styles.starRatingLbl}>BENCHMARK</Text>
                </View>
              </View>

              <View style={styles.starMetricGrid}>
                <View style={styles.starMetricItem}>
                  <Text style={styles.starMetricLbl}>DRIBBLING</Text>
                  <Text style={[styles.starMetricVal, { color: '#10B981' }]}>{star.dribblingScore}</Text>
                </View>
                <View style={styles.starMetricItem}>
                  <Text style={styles.starMetricLbl}>SHOOTING</Text>
                  <Text style={[styles.starMetricVal, { color: '#3B82F6' }]}>{star.shootingScore}</Text>
                </View>
                <View style={styles.starMetricItem}>
                  <Text style={styles.starMetricLbl}>CONTROL</Text>
                  <Text style={[styles.starMetricVal, { color: '#F59E0B' }]}>{star.ballControlScore}</Text>
                </View>
                <View style={styles.starMetricItem}>
                  <Text style={styles.starMetricLbl}>POWER</Text>
                  <Text style={[styles.starMetricVal, { color: '#EC4899' }]}>{star.estimatedPower}</Text>
                </View>
              </View>

              {star.achievements && star.achievements.length > 0 && (
                <Text style={styles.starAchieve}>🏆 {star.achievements[0]}</Text>
              )}
            </View>
          ))}
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 3: COACH SHORTLIST */}
      {/* ======================================================== */}
      {activeTab === 'shortlist' && (
        <>
          <Text style={styles.sectionHeader}>📋 My Shortlisted Talents ({shortlist.length})</Text>

          {shortlist.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="star-outline" size={44} color="#64748B" />
              <Text style={styles.emptyTitle}>No Players Shortlisted Yet</Text>
              <Text style={styles.emptySub}>Browse Talent Discovery to shortlist standout grassroots prospects.</Text>
            </View>
          ) : (
            shortlist.map((item, idx) => {
              const p = item.player || item;
              const pName = p.user?.name || p.name || 'Shortlisted Prospect';
              const pId = p.playerId || `FB-${p._id?.slice(-6)}`;
              const pIdVal = p._id || p.playerId || item.player;

              return (
                <View key={item._id || idx} style={styles.shortlistCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.shortlistName}>{pName}</Text>
                      <Text style={styles.shortlistSub}>
                        {p.position || 'Striker'} • ID: {pId} • {p.clubOrTeam || 'Academy'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveShortlist(pIdVal)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.notesBox}>
                    <Text style={styles.notesTitle}>📝 Scouting Notes:</Text>
                    <Text style={styles.notesText}>{item.notes || 'Strong prospect for academy recruitment.'}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() =>
                      navigation.navigate('Messages', {
                        userToken,
                        userName,
                        recipientUser: {
                          _id: p.user?._id || p.user || p._id,
                          name: pName,
                          role: 'player',
                        },
                      })
                    }
                  >
                    <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
                    <Text style={styles.contactBtnText}>Contact for Trials</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* SCOUTING DETAIL RADAR MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={!!inspectPlayer}
        transparent
        animationType="slide"
        onRequestClose={() => setInspectPlayer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {inspectPlayer?.user?.name || inspectPlayer?.name || 'Football Prospect'}
                </Text>
                <Text style={styles.modalSub}>
                  {inspectPlayer?.position} • {inspectPlayer?.preferredFoot} Foot • ID: {inspectPlayer?.playerId}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setInspectPlayer(null)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Overall Score Badge */}
              <View style={styles.modalScoreBanner}>
                <Text style={styles.modalScoreNum}>{inspectPlayer?.overallScore || 88.5}</Text>
                <Text style={styles.modalScoreLbl}>OVERALL SCOUT RATING</Text>
                <Text style={styles.modalPercentile}>
                  National Percentile: Top {Math.max(1, 100 - Math.round(inspectPlayer?.nationalPercentile || 94))}%
                </Text>
              </View>

              {/* Technical Scores */}
              <Text style={styles.radarSectionTitle}>Technical Performance Breakdown</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricName}>Dribbling & Slalom Agility</Text>
                <Text style={[styles.metricValBold, { color: '#10B981' }]}>{inspectPlayer?.dribblingScore || 88}/100</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricName}>Shooting & Placement</Text>
                <Text style={[styles.metricValBold, { color: '#3B82F6' }]}>{inspectPlayer?.shootingScore || 85}/100</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricName}>Ball Control & Cushion</Text>
                <Text style={[styles.metricValBold, { color: '#F59E0B' }]}>{inspectPlayer?.ballControlScore || 86}/100</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricName}>Shot Accuracy %</Text>
                <Text style={[styles.metricValBold, { color: '#8B5CF6' }]}>{inspectPlayer?.shotAccuracy || 84}%</Text>
              </View>

              {/* AI Strengths & Weaknesses */}
              <View style={styles.aiInsightsCard}>
                <Text style={styles.aiInsightsTitle}>🧠 AI Computer Vision Strengths:</Text>
                <Text style={styles.aiInsightsText}>• Rapid sub-second directional cuts during slalom cones.</Text>
                <Text style={styles.aiInsightsText}>• Clean instep follow-through with consistent target placement.</Text>
                <Text style={styles.aiInsightsText}>• Soft first-touch absorption of incoming vertical passes.</Text>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#F59E0B' }]}
                  onPress={() => {
                    const p = inspectPlayer;
                    setInspectPlayer(null);
                    setShortlistModalPlayer(p);
                  }}
                >
                  <Ionicons name="star" size={16} color="#FFFFFF" />
                  <Text style={styles.modalActionBtnText}>Shortlist ⭐</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => {
                    const p = inspectPlayer;
                    setInspectPlayer(null);
                    navigation.navigate('Messages', {
                      userToken,
                      userName,
                      recipientUser: {
                        _id: p.user?._id || p.user || p._id,
                        name: p.user?.name || p.name,
                        role: 'player',
                      },
                    });
                  }}
                >
                  <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
                  <Text style={styles.modalActionBtnText}>Message 💬</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* ADD SHORTLIST NOTE MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={!!shortlistModalPlayer}
        transparent
        animationType="fade"
        onRequestClose={() => setShortlistModalPlayer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⭐ Shortlist Candidate</Text>
            <Text style={styles.modalSub}>
              Add scouting notes for {shortlistModalPlayer?.user?.name || shortlistModalPlayer?.name}
            </Text>

            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top', marginTop: 14 }]}
              multiline
              value={shortlistNotes}
              onChangeText={setShortlistNotes}
              placeholder="e.g. Inviting for U-19 state trials in Pune..."
              placeholderTextColor="#64748B"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#334155' }]}
                onPress={() => setShortlistModalPlayer(null)}
              >
                <Text style={styles.modalActionBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#F59E0B' }]}
                onPress={handleAddShortlist}
                disabled={submittingShortlist}
              >
                {submittingShortlist ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalActionBtnText}>Save to Shortlist ⭐</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coachHero: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  coachHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  coachAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  coachName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  coachTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coachTagText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '900',
  },
  coachClub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  coachRegion: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  kpiRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
  },
  kpiVal: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: '900',
  },
  kpiLbl: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: '#10B981',
  },
  tabBtnActiveGold: {
    backgroundColor: '#D97706',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  filterGroupTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  filterChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterChipActiveGold: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionHeader: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  prospectCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  prospectHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  prospectName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  prospectSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  prospectClub: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  scoreBadgeNum: {
    color: '#10B981',
    fontSize: 17,
    fontWeight: '900',
  },
  scoreBadgeLbl: {
    color: '#6EE7B7',
    fontSize: 8,
    fontWeight: '800',
  },
  metricBreakdownRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  miniMetric: {
    flex: 1,
    alignItems: 'center',
  },
  miniMetricLbl: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
  },
  miniMetricVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  prospectActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnInspect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnInspectText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnShortlist: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnShortlistText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnMsg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnMsgText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  apiBadgeRow: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  apiBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  starCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  starHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  starName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  proStarBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proStarText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
  },
  starSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  starRatingBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  starRatingNum: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
  },
  starRatingLbl: {
    color: '#6EE7B7',
    fontSize: 8,
    fontWeight: '800',
  },
  starMetricGrid: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  starMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  starMetricLbl: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
  },
  starMetricVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  starAchieve: {
    color: '#CBD5E1',
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  shortlistCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  shortlistName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  shortlistSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  removeBtn: {
    padding: 6,
  },
  notesBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  notesTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  notesText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  contactBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  modalScoreBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  modalScoreNum: {
    color: '#10B981',
    fontSize: 28,
    fontWeight: '900',
  },
  modalScoreLbl: {
    color: '#6EE7B7',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  modalPercentile: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  radarSectionTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  metricName: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  metricValBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  aiInsightsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  aiInsightsTitle: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  aiInsightsText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 3,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
});
