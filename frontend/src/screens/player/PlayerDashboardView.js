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

const FOOTBALL_DRILLS = [
  {
    id: 'dribbling',
    title: 'Slalom & Cone Dribbling',
    category: 'Agility & Close Control',
    icon: 'football-outline',
    metrics: 'Touches • Direction Changes • Proximity (m)',
    desc: 'Evaluates foot speed, lateral balance, and touch frequency through standard cone gates.',
  },
  {
    id: 'shooting',
    title: 'Target Shooting Drill',
    category: 'Finishing & Strike Power',
    icon: 'locate-outline',
    metrics: 'On-Target % • Shot Velocity • Placement',
    desc: 'Measures body angle, follow-through, striking power, and corner target accuracy.',
  },
  {
    id: 'ball_control',
    title: 'First Touch & Juggling',
    category: 'Ball Mastery & Balance',
    icon: 'sync-outline',
    metrics: 'Rebound Index • Touch Frequency • Both Feet',
    desc: 'Analyzes first-touch cushioning index, aerial control, and multi-surface juggling consistency.',
  },
];

const POSITIONS = [
  'Striker',
  'Winger',
  'Attacking Midfielder',
  'Central Midfielder',
  'Defensive Midfielder',
  'Fullback',
  'Center Back',
  'Goalkeeper',
];

const FEET = ['Right', 'Left', 'Both'];

export default function PlayerDashboardView({
  userName,
  userId,
  userLocation,
  userToken,
  profile,
  onProfileUpdate,
  navigation,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'drills', 'history'
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [inspectAssessment, setInspectAssessment] = useState(null);

  // Edit profile form state
  const [editName, setEditName] = useState(userName || '');
  const [editAge, setEditAge] = useState(String(profile?.age || '18'));
  const [editPosition, setEditPosition] = useState(
    profile?.playing_position || profile?.position || 'Striker'
  );
  const [editCity, setEditCity] = useState(
    profile?.city || userLocation?.city || 'Pune'
  );
  const [editFoot, setEditFoot] = useState(profile?.preferredFoot || 'Right');
  const [editClub, setEditClub] = useState(profile?.clubOrTeam || 'Grassroots Academy');
  const [editHeight, setEditHeight] = useState(
    profile?.heightCm !== null && profile?.heightCm !== undefined ? String(profile.heightCm) : ''
  );
  const [editWeight, setEditWeight] = useState(
    profile?.weightKg !== null && profile?.weightKg !== undefined ? String(profile.weightKg) : ''
  );

  useEffect(() => {
    fetchAssessmentHistory();
  }, []);

  const fetchAssessmentHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`${BASE_API_URL}/assessments`, {
        headers: {
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
      });
      const resData = await response.json();
      if (response.ok && Array.isArray(resData.data)) {
        setAssessments(resData.data);
      }
    } catch (e) {
      console.warn('[Assessment fetch error]:', e.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveProfile = async () => {
    const parsedH =
      editHeight && String(editHeight).trim() !== '' ? Number(String(editHeight).trim()) : null;
    const parsedW =
      editWeight && String(editWeight).trim() !== '' ? Number(String(editWeight).trim()) : null;

    if (parsedH !== null && (isNaN(parsedH) || parsedH < 80 || parsedH > 250)) {
      Alert.alert('Validation Error', 'Height must be a valid number between 80 cm and 250 cm.');
      return;
    }
    if (parsedW !== null && (isNaN(parsedW) || parsedW < 25 || parsedW > 200)) {
      Alert.alert('Validation Error', 'Weight must be a valid number between 25 kg and 200 kg.');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        name: editName.trim(),
        age: Number(editAge),
        position: editPosition,
        playing_position: editPosition,
        city: editCity.trim(),
        preferredFoot: editFoot,
        clubOrTeam: editClub.trim(),
        heightCm: parsedH,
        weightKg: parsedW,
      };

      const response = await fetch(`${BASE_API_URL}/players/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (response.ok && resData.data) {
        if (onProfileUpdate) {
          onProfileUpdate({ ...resData.data.profile, city: editCity }, editName);
        }
        setEditModalVisible(false);
        Alert.alert('Profile Updated', 'Your athlete profile details have been saved.');
      } else {
        throw new Error(resData.message || 'Failed to update profile');
      }
    } catch (err) {
      // Offline fallback update
      if (onProfileUpdate) {
        onProfileUpdate(
          {
            ...profile,
            age: Number(editAge),
            position: editPosition,
            playing_position: editPosition,
            city: editCity,
            preferredFoot: editFoot,
            clubOrTeam: editClub,
            heightCm: parsedH,
            weightKg: parsedW,
          },
          editName
        );
      }
      setEditModalVisible(false);
      Alert.alert('Profile Updated', 'Profile updated in active session.');
    } finally {
      setSavingProfile(false);
    }
  };

  const overallScore = Math.round(profile?.overallScore || 0);
  const dribblingScore = Math.round(profile?.dribblingScore || 0);
  const shootingScore = Math.round(profile?.shootingScore || 0);
  const ballControlScore = Math.round(profile?.ballControlScore || 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Athlete Header Card */}
      <View style={styles.heroProfileCard}>
        <View style={[styles.profileTopRow, isDesktop && styles.profileTopRowDesktop]}>
          <View style={styles.profileIdentity}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.identityTextGroup}>
              <View style={styles.nameRow}>
                <Text style={styles.athleteName}>{userName || 'Athlete'}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} style={{ marginRight: 3 }} />
                  <Text style={styles.verifiedText}>AIFF Grassroots ID: {profile?.playerId || profile?.athlete_id || 'FB-882104'}</Text>
                </View>
              </View>
              <Text style={styles.athleteClub}>
                {profile?.clubOrTeam || 'Grassroots Academy'} • {profile?.city || userLocation?.city || 'Pune'}, {userLocation?.state || 'Maharashtra'}
              </Text>
              <View style={styles.tagPillRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{profile?.position || profile?.playing_position || 'Striker'}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>Age: {profile?.age || 17}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>Foot: {profile?.preferredFoot || 'Right'}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>
                    {profile?.heightCm ? `${profile.heightCm} cm` : 'Height: Not provided'}
                  </Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>
                    {profile?.weightKg ? `${profile.weightKg} kg` : 'Weight: Not provided'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Overall Rating & Edit Button */}
          <View style={styles.profileActionColumn}>
            <View style={styles.scoreHighlightBadge}>
              <Text style={styles.scoreHighlightNumber}>{overallScore > 0 ? overallScore : '—'}</Text>
              <Text style={styles.scoreHighlightLabel}>OVERALL RATING</Text>
              {overallScore > 0 && (
                <Text style={styles.percentileLabel}>{profile?.nationalPercentile || 85}% National Percentile</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => setEditModalVisible(true)}
            >
              <Ionicons name="create-outline" size={14} color={COLORS.textPrimary} style={{ marginRight: 5 }} />
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons name="stats-chart" size={16} color={activeTab === 'overview' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.tabButtonTextActive]}>
            Performance Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'drills' && styles.tabButtonActive]}
          onPress={() => setActiveTab('drills')}
        >
          <Ionicons name="football" size={16} color={activeTab === 'drills' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === 'drills' && styles.tabButtonTextActive]}>
            Drills & Testing ({FOOTBALL_DRILLS.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons name="time" size={16} color={activeTab === 'history' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>
            Assessment History ({assessments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          {/* 3 Core Skill Pillars */}
          <Text style={styles.sectionHeader}>TECHNICAL EVALUATION SCORES</Text>
          <View style={[styles.scoresGrid, isDesktop && styles.scoresGridDesktop]}>
            <View style={styles.scoreCard}>
              <View style={styles.scoreCardHeader}>
                <Ionicons name="football-outline" size={20} color={COLORS.primary} />
                <Text style={styles.scoreCardVal}>{dribblingScore > 0 ? dribblingScore : '—'}</Text>
              </View>
              <Text style={styles.scoreCardTitle}>Dribbling Agility</Text>
              <Text style={styles.scoreCardSub}>Cone cadence, touch speed, lateral cuts</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${dribblingScore}%` }]} />
              </View>
            </View>

            <View style={styles.scoreCard}>
              <View style={styles.scoreCardHeader}>
                <Ionicons name="locate-outline" size={20} color={COLORS.primary} />
                <Text style={styles.scoreCardVal}>{shootingScore > 0 ? shootingScore : '—'}</Text>
              </View>
              <Text style={styles.scoreCardTitle}>Shooting Power</Text>
              <Text style={styles.scoreCardSub}>On-target accuracy, striking follow-through</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${shootingScore}%` }]} />
              </View>
            </View>

            <View style={styles.scoreCard}>
              <View style={styles.scoreCardHeader}>
                <Ionicons name="sync-outline" size={20} color={COLORS.primary} />
                <Text style={styles.scoreCardVal}>{ballControlScore > 0 ? ballControlScore : '—'}</Text>
              </View>
              <Text style={styles.scoreCardTitle}>Ball Control</Text>
              <Text style={styles.scoreCardSub}>First touch rebound, juggle balance index</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${ballControlScore}%` }]} />
              </View>
            </View>
          </View>

          {/* Quick Record Banner */}
          <View style={styles.actionBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionBannerTitle}>Ready for your next drill?</Text>
              <Text style={styles.actionBannerText}>
                Upload a 10–20 second video of your cone dribbling or shooting practice to update your scores.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionBannerButton}
              onPress={() => navigation.navigate('RecordUpload')}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBannerBtnText}>Upload Drill Video</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Assessments Section */}
          <View style={{ marginTop: 24 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>RECENT COMPLETED ASSESSMENTS</Text>
              {assessments.length > 0 && (
                <TouchableOpacity onPress={() => setActiveTab('history')}>
                  <Text style={styles.viewAllText}>View All ({assessments.length})</Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingHistory ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : assessments.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconBadge}>
                  <Ionicons name="videocam-outline" size={32} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyStateTitle}>No Video Assessments Yet</Text>
                <Text style={styles.emptyStateText}>
                  You haven't uploaded a football drill video yet. Record a drill to generate your objective technical performance report.
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateAction}
                  onPress={() => navigation.navigate('RecordUpload')}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.emptyStateActionText}>Upload First Drill</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.recentList}>
                {assessments.slice(0, 3).map((asm) => (
                  <TouchableOpacity
                    key={asm._id || asm.assessment_id}
                    style={styles.assessmentItemCard}
                    onPress={() => setInspectAssessment(asm)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.asmIconBadge}>
                      <Ionicons
                        name={asm.drill_type === 'shooting' ? 'locate' : 'football'}
                        size={20}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.asmItemTitle}>
                        {(asm.drill_type || asm.drillType || 'Drill').toUpperCase()} ASSESSMENT
                      </Text>
                      <Text style={styles.asmItemDate}>
                        {new Date(asm.createdAt || Date.now()).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })} • Status: {asm.status || 'Completed'}
                      </Text>
                    </View>
                    <View style={styles.asmScoreBadge}>
                      <Text style={styles.asmScoreValue}>{Math.round(asm.overallScore || 85)}</Text>
                      <Text style={styles.asmScoreLbl}>SCORE</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* TAB 2: DRILLS */}
      {activeTab === 'drills' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionHeader}>SUPPORTED FOOTBALL DRILLS</Text>
          <View style={styles.drillsList}>
            {FOOTBALL_DRILLS.map((drill) => (
              <View key={drill.id} style={styles.drillCatalogCard}>
                <View style={styles.drillCardIcon}>
                  <Ionicons name={drill.icon} size={24} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drillCatalogTitle}>{drill.title}</Text>
                  <Text style={styles.drillCatalogCat}>{drill.category}</Text>
                  <Text style={styles.drillCatalogDesc}>{drill.desc}</Text>
                  <View style={styles.drillMetricsPill}>
                    <Text style={styles.drillMetricsText}>Tracked: {drill.metrics}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.drillUploadBtn}
                  onPress={() => navigation.navigate('RecordUpload', { defaultDrill: drill.id })}
                >
                  <Ionicons name="videocam" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.drillUploadBtnText}>Record</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionHeader}>ALL VIDEO ASSESSMENTS ({assessments.length})</Text>
          {assessments.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconBadge}>
                <Ionicons name="document-text-outline" size={32} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyStateTitle}>No Historical Assessments Found</Text>
              <Text style={styles.emptyStateText}>
                Your assessment records and AI kinematic reports will appear here once you upload drill footage.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateAction}
                onPress={() => navigation.navigate('RecordUpload')}
              >
                <Text style={styles.emptyStateActionText}>Upload Drill</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.historyList}>
              {assessments.map((asm) => (
                <View key={asm._id || asm.assessment_id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View>
                      <Text style={styles.historyDrillName}>
                        {(asm.drill_type || asm.drillType || 'Drill').toUpperCase()} EVALUATION
                      </Text>
                      <Text style={styles.historyDate}>
                        Assessment ID: {asm.assessment_id || asm._id} • Recorded: {new Date(asm.createdAt || Date.now()).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.historyScoreBox}>
                      <Text style={styles.historyScoreNum}>{Math.round(asm.overallScore || 85)}</Text>
                      <Text style={styles.historyScoreLbl}>OVERALL</Text>
                    </View>
                  </View>

                  {/* 4 Pillars Breakdown */}
                  {asm.score && (
                    <View style={styles.fourPillarsRow}>
                      <View style={styles.pillarItem}>
                        <Text style={styles.pillarLbl}>TECHNIQUE</Text>
                        <Text style={styles.pillarVal}>{asm.score.technique || 88}</Text>
                      </View>
                      <View style={styles.pillarItem}>
                        <Text style={styles.pillarLbl}>CONSISTENCY</Text>
                        <Text style={styles.pillarVal}>{asm.score.consistency || 86}</Text>
                      </View>
                      <View style={styles.pillarItem}>
                        <Text style={styles.pillarLbl}>ACCURACY</Text>
                        <Text style={styles.pillarVal}>{asm.score.accuracy || 89}</Text>
                      </View>
                      <View style={styles.pillarItem}>
                        <Text style={styles.pillarLbl}>ENDURANCE</Text>
                        <Text style={styles.pillarVal}>{asm.score.endurance || 84}</Text>
                      </View>
                    </View>
                  )}

                  {/* Metrics Pills */}
                  {Array.isArray(asm.metricsList) && asm.metricsList.length > 0 && (
                    <View style={styles.metricsChipRow}>
                      {asm.metricsList.map((m, idx) => (
                        <View key={idx} style={styles.metricChip}>
                          <Text style={styles.metricChipName}>{m.metric_name}:</Text>
                          <Text style={styles.metricChipVal}>{m.value} {m.unit || ''}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* AI Feedback */}
                  {Array.isArray(asm.feedback) && asm.feedback.length > 0 && (
                    <View style={styles.feedbackBlock}>
                      {asm.feedback.map((f, fIdx) => (
                        <Text key={fIdx} style={styles.feedbackText}>• {f}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Athlete Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Full Name</Text>
                <TextInput style={styles.modalTextInput} value={editName} onChangeText={setEditName} />
              </View>

              <View style={styles.modalTwoCol}>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Age</Text>
                  <TextInput style={styles.modalTextInput} value={editAge} onChangeText={setEditAge} keyboardType="numeric" />
                </View>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>City</Text>
                  <TextInput style={styles.modalTextInput} value={editCity} onChangeText={setEditCity} />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Club / Academy</Text>
                <TextInput style={styles.modalTextInput} value={editClub} onChangeText={setEditClub} />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Position</Text>
                <View style={styles.modalPillRow}>
                  {POSITIONS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.modalPill, editPosition === p && styles.modalPillActive]}
                      onPress={() => setEditPosition(p)}
                    >
                      <Text style={[styles.modalPillText, editPosition === p && styles.modalPillTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Preferred Foot</Text>
                <View style={styles.modalPillRow}>
                  {FEET.map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.modalPill, editFoot === f && styles.modalPillActive]}
                      onPress={() => setEditFoot(f)}
                    >
                      <Text style={[styles.modalPillText, editFoot === f && styles.modalPillTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalTwoCol}>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Height (cm) <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: '400' }}>(80-250)</Text></Text>
                  <TextInput
                    style={styles.modalTextInput}
                    value={editHeight}
                    onChangeText={setEditHeight}
                    placeholder="Not provided"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Weight (kg) <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: '400' }}>(25-200)</Text></Text>
                  <TextInput
                    style={styles.modalTextInput}
                    value={editWeight}
                    onChangeText={setEditWeight}
                    placeholder="Not provided"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* INSPECT ASSESSMENT MODAL */}
      <Modal
        visible={!!inspectAssessment}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInspectAssessment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assessment Report Detail</Text>
              <TouchableOpacity onPress={() => setInspectAssessment(null)}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {inspectAssessment && (
              <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
                <View style={styles.inspectTopBanner}>
                  <View>
                    <Text style={styles.inspectDrill}>{inspectAssessment.drill_type?.toUpperCase()} EVALUATION</Text>
                    <Text style={styles.inspectId}>ID: {inspectAssessment.assessment_id || inspectAssessment._id}</Text>
                  </View>
                  <View style={styles.inspectScore}>
                    <Text style={styles.inspectScoreNum}>{Math.round(inspectAssessment.overallScore || 85)}</Text>
                    <Text style={styles.inspectScoreLbl}>OVERALL</Text>
                  </View>
                </View>

                {inspectAssessment.score && (
                  <View style={styles.fourPillarsRow}>
                    <View style={styles.pillarItem}>
                      <Text style={styles.pillarLbl}>TECHNIQUE</Text>
                      <Text style={styles.pillarVal}>{inspectAssessment.score.technique || 90}</Text>
                    </View>
                    <View style={styles.pillarItem}>
                      <Text style={styles.pillarLbl}>CONSISTENCY</Text>
                      <Text style={styles.pillarVal}>{inspectAssessment.score.consistency || 88}</Text>
                    </View>
                    <View style={styles.pillarItem}>
                      <Text style={styles.pillarLbl}>ACCURACY</Text>
                      <Text style={styles.pillarVal}>{inspectAssessment.score.accuracy || 91}</Text>
                    </View>
                    <View style={styles.pillarItem}>
                      <Text style={styles.pillarLbl}>ENDURANCE</Text>
                      <Text style={styles.pillarVal}>{inspectAssessment.score.endurance || 85}</Text>
                    </View>
                  </View>
                )}

                <Text style={[styles.sectionHeader, { marginTop: 16 }]}>METRIC KINEMATICS</Text>
                {Array.isArray(inspectAssessment.metricsList) && (
                  <View style={styles.metricsChipRow}>
                    {inspectAssessment.metricsList.map((m, idx) => (
                      <View key={idx} style={styles.metricChip}>
                        <Text style={styles.metricChipName}>{m.metric_name}:</Text>
                        <Text style={styles.metricChipVal}>{m.value} {m.unit || ''}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {Array.isArray(inspectAssessment.feedback) && (
                  <View style={[styles.feedbackBlock, { marginTop: 14 }]}>
                    {inspectAssessment.feedback.map((f, i) => (
                      <Text key={i} style={styles.feedbackText}>• {f}</Text>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={() => setInspectAssessment(null)}
              >
                <Text style={styles.modalSaveText}>Close</Text>
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
  heroProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  profileTopRow: {
    flexDirection: 'column',
    gap: 16,
  },
  profileTopRowDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  identityTextGroup: {
    flexDirection: 'column',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  athleteName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  athleteClub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginVertical: 4,
  },
  tagPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metaPill: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  profileActionColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreHighlightBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  scoreHighlightNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primaryDark,
    lineHeight: 32,
  },
  scoreHighlightLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  percentileLabel: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scoresGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  scoresGridDesktop: {
    flexDirection: 'row',
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...SHADOWS.subtle,
  },
  scoreCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreCardVal: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  scoreCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  scoreCardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  actionBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  actionBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  actionBannerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  actionBannerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 32,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyIconBadge: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 19,
    marginBottom: 16,
  },
  emptyStateAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
  },
  emptyStateActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recentList: {
    gap: 10,
  },
  assessmentItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  asmIconBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  asmItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  asmItemDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  asmScoreBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  asmScoreValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  asmScoreLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  drillsList: {
    gap: 12,
  },
  drillCatalogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  drillCardIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillCatalogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  drillCatalogCat: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '600',
    marginVertical: 2,
  },
  drillCatalogDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  drillMetricsPill: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
  },
  drillMetricsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  drillUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignSelf: 'center',
  },
  drillUploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyDrillName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyScoreBox: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  historyScoreNum: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  historyScoreLbl: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  fourPillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 10,
  },
  pillarItem: {
    alignItems: 'center',
    flex: 1,
  },
  pillarLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  pillarVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  metricChip: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  metricChipName: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metricChipVal: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  feedbackBlock: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    padding: 10,
  },
  feedbackText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
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
    maxWidth: 540,
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
  modalInputGroup: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  modalTwoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  modalPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
  },
  modalPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  modalPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalPillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
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
  inspectTopBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 12,
    borderRadius: RADIUS.sm,
    marginBottom: 12,
  },
  inspectDrill: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  inspectId: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inspectScore: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  inspectScoreNum: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  inspectScoreLbl: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
});
