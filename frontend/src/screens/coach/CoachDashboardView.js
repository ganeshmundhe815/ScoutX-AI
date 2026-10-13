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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../../services/apiConfig';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const POSITION_FILTERS = ['All', 'Striker', 'Winger', 'Midfielder', 'Defender', 'Goalkeeper'];
const FOOT_FILTERS = ['All', 'Right', 'Left'];
const SCORE_FILTERS = ['All Scores', '80+ Elite', '85+ Pro', '90+ World Class'];

export default function CoachDashboardView({
  userName,
  userLocation,
  userToken,
  navigation,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [activeTab, setActiveTab] = useState('discovery'); // 'discovery', 'shortlist', 'benchmarks'
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [shortlist, setShortlist] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPos, setSelectedPos] = useState('All');
  const [selectedFoot, setSelectedFoot] = useState('All');
  const [selectedMinScore, setSelectedMinScore] = useState('All Scores');

  // Modals
  const [inspectPlayer, setInspectPlayer] = useState(null);
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

      if (response.ok) {
        Alert.alert('Shortlisted', `${shortlistModalPlayer.user?.name || shortlistModalPlayer.name} has been added to your shortlist.`);
        setShortlistModalPlayer(null);
        fetchShortlist();
      }
    } catch (err) {
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
    } catch (err) {
      setShortlist((prev) => prev.filter((item) => item.player?._id !== playerId && item.player !== playerId && item._id !== playerId));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Coach Header Summary Card */}
      <View style={styles.coachHeaderCard}>
        <View style={[styles.headerRow, isDesktop && styles.headerRowDesktop]}>
          <View style={styles.coachIdentity}>
            <View style={styles.avatarCircle}>
              <Ionicons name="briefcase" size={26} color={COLORS.primary} />
            </View>
            <View>
              <View style={styles.nameRow}>
                <Text style={styles.coachName}>{userName || 'Coach'}</Text>
                <View style={styles.licenseBadge}>
                  <Text style={styles.licenseText}>AFC A / UEFA A Licensed</Text>
                </View>
              </View>
              <Text style={styles.coachSub}>
                Head Youth Scout • Mumbai City Youth Academy • Scouting: Maharashtra, Goa, Kerala, Mizoram
              </Text>
            </View>
          </View>

          <View style={styles.kpiPillsRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiNumber}>{players.length}</Text>
              <Text style={styles.kpiLabel}>ATHLETES IN POOL</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiNumber}>{shortlist.length}</Text>
              <Text style={styles.kpiLabel}>SHORTLISTED</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'discovery' && styles.tabButtonActive]}
          onPress={() => setActiveTab('discovery')}
        >
          <Ionicons name="search" size={16} color={activeTab === 'discovery' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === 'discovery' && styles.tabButtonTextActive]}>
            Player Discovery ({players.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'shortlist' && styles.tabButtonActive]}
          onPress={() => setActiveTab('shortlist')}
        >
          <Ionicons name="bookmark" size={16} color={activeTab === 'shortlist' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === 'shortlist' && styles.tabButtonTextActive]}>
            Shortlisted Talent ({shortlist.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'benchmarks' && styles.tabButtonActive]}
          onPress={() => setActiveTab('benchmarks')}
        >
          <Ionicons name="ribbon" size={16} color={activeTab === 'benchmarks' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === 'benchmarks' && styles.tabButtonTextActive]}>
            National Benchmarks ({benchmarks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: PLAYER DISCOVERY */}
      {activeTab === 'discovery' && (
        <View style={styles.tabContent}>
          {/* Search & Filter Bar */}
          <View style={styles.filterCard}>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search athlete by name, club, or district..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Position Pills */}
            <View style={styles.filterPillsGroup}>
              <Text style={styles.filterGroupLabel}>Position:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {POSITION_FILTERS.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.filterPill, selectedPos === pos && styles.filterPillActive]}
                    onPress={() => setSelectedPos(pos)}
                  >
                    <Text style={[styles.filterPillText, selectedPos === pos && styles.filterPillTextActive]}>{pos}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Preferred Foot & Min Score Pills */}
            <View style={styles.filterRowSecondary}>
              <View style={styles.filterPillsGroup}>
                <Text style={styles.filterGroupLabel}>Foot:</Text>
                {FOOT_FILTERS.map((foot) => (
                  <TouchableOpacity
                    key={foot}
                    style={[styles.filterPill, selectedFoot === foot && styles.filterPillActive]}
                    onPress={() => setSelectedFoot(foot)}
                  >
                    <Text style={[styles.filterPillText, selectedFoot === foot && styles.filterPillTextActive]}>{foot}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterPillsGroup}>
                <Text style={styles.filterGroupLabel}>Threshold:</Text>
                {SCORE_FILTERS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.filterPill, selectedMinScore === s && styles.filterPillActive]}
                    onPress={() => setSelectedMinScore(s)}
                  >
                    <Text style={[styles.filterPillText, selectedMinScore === s && styles.filterPillTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Athletes Grid */}
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 32 }} />
          ) : players.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={36} color={COLORS.textMuted} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>No Matching Football Athletes Found</Text>
              <Text style={styles.emptyText}>Try loosening your search filters or resetting the score threshold.</Text>
            </View>
          ) : (
            <View style={[styles.playersGrid, isDesktop && styles.playersGridDesktop]}>
              {players.map((p) => {
                const playerName = p.user?.name || p.name || 'Football Athlete';
                const pOverall = Math.round(p.overallScore || 80);
                const isShortlisted = shortlist.some(
                  (s) => s.player?._id === p._id || s.player === p._id || s.athlete_id === p.athlete_id
                );

                return (
                  <View key={p._id || p.athlete_id} style={styles.playerCard}>
                    <View style={styles.playerCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.playerName}>{playerName}</Text>
                        <Text style={styles.playerClub}>{p.clubOrTeam || 'Grassroots Academy'}</Text>
                        <Text style={styles.playerMeta}>
                          {p.position || p.playing_position || 'Striker'} • {p.age || 17} yrs • {p.city || 'Bengaluru'}
                        </Text>
                      </View>
                      <View style={styles.playerScoreBadge}>
                        <Text style={styles.playerScoreNum}>{pOverall}</Text>
                        <Text style={styles.playerScoreLbl}>RATING</Text>
                      </View>
                    </View>

                    {/* Drill Mini Scores */}
                    <View style={styles.drillScoresRow}>
                      <View style={styles.miniScoreItem}>
                        <Text style={styles.miniScoreLbl}>DRIBBLE</Text>
                        <Text style={styles.miniScoreVal}>{Math.round(p.dribblingScore || 85)}</Text>
                      </View>
                      <View style={styles.miniScoreDivider} />
                      <View style={styles.miniScoreItem}>
                        <Text style={styles.miniScoreLbl}>SHOOT</Text>
                        <Text style={styles.miniScoreVal}>{Math.round(p.shootingScore || 82)}</Text>
                      </View>
                      <View style={styles.miniScoreDivider} />
                      <View style={styles.miniScoreItem}>
                        <Text style={styles.miniScoreLbl}>CONTROL</Text>
                        <Text style={styles.miniScoreVal}>{Math.round(p.ballControlScore || 86)}</Text>
                      </View>
                    </View>

                    {/* Card Actions */}
                    <View style={styles.playerActionsRow}>
                      <TouchableOpacity
                        style={styles.inspectBtn}
                        onPress={() => setInspectPlayer(p)}
                      >
                        <Text style={styles.inspectBtnText}>Inspect Profile</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.shortlistActionBtn, isShortlisted && styles.shortlistActionBtnActive]}
                        onPress={() => {
                          if (isShortlisted) {
                            handleRemoveShortlist(p._id);
                          } else {
                            setShortlistModalPlayer(p);
                          }
                        }}
                      >
                        <Ionicons
                          name={isShortlisted ? 'bookmark' : 'bookmark-outline'}
                          size={15}
                          color={isShortlisted ? '#FFFFFF' : COLORS.textPrimary}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.shortlistActionText, isShortlisted && { color: '#FFFFFF' }]}>
                          {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* TAB 2: SHORTLIST */}
      {activeTab === 'shortlist' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionHeader}>SHORTLISTED CANDIDATES ({shortlist.length})</Text>
          {shortlist.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bookmark-outline" size={36} color={COLORS.textMuted} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>No Shortlisted Players</Text>
              <Text style={styles.emptyText}>
                Explore the Player Discovery tab and click "Shortlist" to save promising candidates for your academy trials.
              </Text>
            </View>
          ) : (
            <View style={styles.shortlistGrid}>
              {shortlist.map((item) => {
                const athlete = item.player || {};
                const name = athlete.user?.name || athlete.name || 'Shortlisted Player';
                return (
                  <View key={item._id || item.shortlist_id} style={styles.shortlistCard}>
                    <View style={styles.shortlistCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.shortlistPlayerName}>{name}</Text>
                        <Text style={styles.shortlistPlayerClub}>{athlete.clubOrTeam || 'Academy Player'} • {athlete.city || 'India'}</Text>
                        <Text style={styles.shortlistPlayerPos}>{athlete.position || athlete.playing_position || 'Forward'}</Text>
                      </View>
                      <View style={styles.playerScoreBadge}>
                        <Text style={styles.playerScoreNum}>{Math.round(athlete.overallScore || 88)}</Text>
                        <Text style={styles.playerScoreLbl}>RATING</Text>
                      </View>
                    </View>

                    {item.notes || item.note ? (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesLabel}>Scouting Note:</Text>
                        <Text style={styles.notesText}>{item.notes || item.note}</Text>
                      </View>
                    ) : null}

                    <View style={styles.shortlistActions}>
                      <TouchableOpacity
                        style={styles.messageCandidateBtn}
                        onPress={() => navigation.navigate('Messages', { userRole: 'coach', userName })}
                      >
                        <Ionicons name="chatbubble-outline" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
                        <Text style={styles.messageCandidateText}>Message Athlete</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.removeShortlistBtn}
                        onPress={() => handleRemoveShortlist(athlete._id || item._id)}
                      >
                        <Ionicons name="trash-outline" size={14} color={COLORS.accentRed} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* TAB 3: BENCHMARKS */}
      {activeTab === 'benchmarks' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionHeader}>POSITION-SPECIFIC TARGET BENCHMARKS</Text>
          <View style={styles.benchmarksList}>
            {benchmarks.map((bm) => (
              <View key={bm._id || bm.position} style={styles.benchmarkCard}>
                <View style={styles.benchmarkHeader}>
                  <Text style={styles.benchmarkPos}>{bm.position} Standard</Text>
                  <View style={styles.benchmarkTargetBadge}>
                    <Text style={styles.benchmarkTargetText}>Target: {bm.targetScore || 85}+</Text>
                  </View>
                </View>
                <Text style={styles.benchmarkDesc}>{bm.description}</Text>
                {Array.isArray(bm.recommendedDrills) && (
                  <View style={styles.benchmarkDrillTags}>
                    {bm.recommendedDrills.map((d, dIdx) => (
                      <View key={dIdx} style={styles.drillTag}>
                        <Text style={styles.drillTagText}>{d}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* SHORTLIST MODAL */}
      <Modal
        visible={!!shortlistModalPlayer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShortlistModalPlayer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Athlete to Shortlist</Text>
              <TouchableOpacity onPress={() => setShortlistModalPlayer(null)}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {shortlistModalPlayer && (
              <View>
                <Text style={styles.modalPlayerName}>
                  Candidate: {shortlistModalPlayer.user?.name || shortlistModalPlayer.name}
                </Text>
                <Text style={styles.modalPlayerSub}>
                  {shortlistModalPlayer.position || 'Striker'} • {shortlistModalPlayer.clubOrTeam || 'Academy'}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Scouting Assessment Notes</Text>
                  <TextInput
                    style={styles.modalTextArea}
                    multiline
                    numberOfLines={3}
                    value={shortlistNotes}
                    onChangeText={setShortlistNotes}
                    placeholder="Enter observation notes, trial suitability, or invite details..."
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShortlistModalPlayer(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleAddShortlist}
                disabled={submittingShortlist}
              >
                {submittingShortlist ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save to Shortlist</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* INSPECT PLAYER MODAL */}
      <Modal
        visible={!!inspectPlayer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInspectPlayer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Athlete Performance Dossier</Text>
              <TouchableOpacity onPress={() => setInspectPlayer(null)}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {inspectPlayer && (
              <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
                <View style={styles.inspectHeroRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inspectName}>{inspectPlayer.user?.name || inspectPlayer.name}</Text>
                    <Text style={styles.inspectClub}>{inspectPlayer.clubOrTeam} • {inspectPlayer.city}</Text>
                    <Text style={styles.inspectMeta}>
                      Position: {inspectPlayer.position || inspectPlayer.playing_position || 'Forward'} • Age: {inspectPlayer.age || 18} • Foot: {inspectPlayer.preferredFoot || 'Right'}
                    </Text>
                    <Text style={[styles.inspectMeta, { marginTop: 2 }]}>
                      Height: {inspectPlayer.heightCm ? `${inspectPlayer.heightCm} cm` : 'Not provided'} • Weight: {inspectPlayer.weightKg ? `${inspectPlayer.weightKg} kg` : 'Not provided'}
                    </Text>
                  </View>
                  <View style={styles.playerScoreBadge}>
                    <Text style={styles.playerScoreNum}>{Math.round(inspectPlayer.overallScore || 85)}</Text>
                    <Text style={styles.playerScoreLbl}>RATING</Text>
                  </View>
                </View>

                <View style={styles.inspectScoresGrid}>
                  <View style={styles.inspectScoreItem}>
                    <Text style={styles.inspectScoreLbl}>DRIBBLE</Text>
                    <Text style={styles.inspectScoreVal}>{Math.round(inspectPlayer.dribblingScore || 88)}</Text>
                  </View>
                  <View style={styles.inspectScoreItem}>
                    <Text style={styles.inspectScoreLbl}>SHOOT</Text>
                    <Text style={styles.inspectScoreVal}>{Math.round(inspectPlayer.shootingScore || 85)}</Text>
                  </View>
                  <View style={styles.inspectScoreItem}>
                    <Text style={styles.inspectScoreLbl}>CONTROL</Text>
                    <Text style={styles.inspectScoreVal}>{Math.round(inspectPlayer.ballControlScore || 87)}</Text>
                  </View>
                  <View style={styles.inspectScoreItem}>
                    <Text style={styles.inspectScoreLbl}>PERCENTILE</Text>
                    <Text style={styles.inspectScoreVal}>{inspectPlayer.nationalPercentile || 92}%</Text>
                  </View>
                </View>

                {Array.isArray(inspectPlayer.achievements) && inspectPlayer.achievements.length > 0 && (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.sectionHeader}>VERIFIED ACHIEVEMENTS</Text>
                    {inspectPlayer.achievements.map((ach, aIdx) => (
                      <View key={aIdx} style={styles.achievementRow}>
                        <Ionicons name="trophy-outline" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.achievementText}>{ach.title || ach}: {ach.description || ''}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={() => setInspectPlayer(null)}
              >
                <Text style={styles.modalSaveText}>Close Dossier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  contentContainer: {
    padding: SPACING.md,
    maxWidth: 1240,
    width: '100%',
    marginHorizontal: 'auto',
  },
  coachHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'column',
    gap: 16,
  },
  headerRowDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coachIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  coachName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  licenseBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  licenseText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  coachSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  kpiPillsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  tabContent: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  filterPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 4,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
  },
  filterPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  filterRowSecondary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 400,
  },
  playersGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  playersGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  playerCard: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...SHADOWS.subtle,
  },
  playerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  playerClub: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '600',
    marginVertical: 2,
  },
  playerMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  playerScoreBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  playerScoreNum: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  playerScoreLbl: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  drillScoresRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    padding: 8,
    marginBottom: 14,
  },
  miniScoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  miniScoreDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  miniScoreLbl: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  miniScoreVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  playerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  inspectBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inspectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  shortlistActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  shortlistActionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  shortlistActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  shortlistGrid: {
    gap: 12,
  },
  shortlistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  shortlistCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  shortlistPlayerName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  shortlistPlayerClub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  shortlistPlayerPos: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  notesBox: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  shortlistActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  messageCandidateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  messageCandidateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  removeShortlistBtn: {
    padding: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  benchmarksList: {
    gap: 12,
  },
  benchmarkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  benchmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  benchmarkPos: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  benchmarkTargetBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  benchmarkTargetText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  benchmarkDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  benchmarkDrillTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  drillTag: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  drillTagText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxWidth: 520,
    width: '100%',
    marginHorizontal: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalPlayerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalPlayerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inspectHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 12,
    borderRadius: RADIUS.sm,
    marginBottom: 12,
  },
  inspectName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  inspectClub: {
    fontSize: 12,
    color: COLORS.primaryDark,
    marginVertical: 2,
    fontWeight: '600',
  },
  inspectMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  inspectScoresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 12,
  },
  inspectScoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  inspectScoreLbl: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  inspectScoreVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  achievementText: {
    fontSize: 12,
    color: COLORS.textPrimary,
  },
});
