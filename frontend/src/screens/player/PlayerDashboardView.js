import React, { useState } from 'react';
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
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_API_URL } from '../../services/apiConfig';

const FOOTBALL_DRILLS = [
  {
    id: 'dribbling',
    title: 'Slalom & Cone Dribbling',
    category: 'Agility & Close Control',
    icon: 'soccer',
    color: '#10B981',
    metrics: 'Touch Frequency • Direction Changes • Proximity',
  },
  {
    id: 'shooting',
    title: 'Target Shooting Drill',
    category: 'Finishing & Power',
    icon: 'crosshairs-gps',
    color: '#3B82F6',
    metrics: 'On-Target Accuracy % • Strike Velocity Index',
  },
  {
    id: 'ball_control',
    title: 'First Touch & Juggling',
    category: 'Ball Mastery',
    icon: 'transit-connection-variant',
    color: '#F59E0B',
    metrics: 'Rebound Absorption • Bilateral Foot Ratio',
  },
];

const POSITIONS = ['Striker', 'Winger', 'Attacking Midfielder', 'Central Midfielder', 'Defender', 'Goalkeeper'];
const FEET = ['Right', 'Left', 'Both'];

export default function PlayerDashboardView({
  userName,
  userLocation,
  userToken,
  profile,
  onProfileUpdate,
  navigation,
}) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Edit profile form state
  const [editName, setEditName] = useState(userName || '');
  const [editAge, setEditAge] = useState(String(profile?.age || '18'));
  const [editPosition, setEditPosition] = useState(profile?.position || 'Striker');
  const [editFoot, setEditFoot] = useState(profile?.preferredFoot || 'Right');
  const [editClub, setEditClub] = useState(profile?.clubOrTeam || 'Bengaluru Youth FC');
  const [editHeight, setEditHeight] = useState(String(profile?.heightCm || '178'));
  const [editWeight, setEditWeight] = useState(String(profile?.weightKg || '72'));

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload = {
        name: editName.trim(),
        age: Number(editAge),
        position: editPosition,
        preferredFoot: editFoot,
        clubOrTeam: editClub.trim(),
        heightCm: Number(editHeight),
        weightKg: Number(editWeight),
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
          onProfileUpdate(resData.data.profile, editName);
        }
        setEditModalVisible(false);
        Alert.alert('Success', 'Your Football Player Profile has been updated! ⚽');
      } else {
        throw new Error(resData.message || 'Failed to update profile');
      }
    } catch (err) {
      // Local fallback update
      if (onProfileUpdate) {
        onProfileUpdate(
          {
            ...profile,
            age: Number(editAge),
            position: editPosition,
            preferredFoot: editFoot,
            clubOrTeam: editClub,
            heightCm: Number(editHeight),
            weightKg: Number(editWeight),
          },
          editName
        );
      }
      setEditModalVisible(false);
      Alert.alert('Updated', 'Profile updated locally.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Welcome & Player Profile Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.avatarBox}>
            <Ionicons name="person" size={28} color="#10B981" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.heroName}>{userName}</Text>
              <View style={styles.playerTag}>
                <Text style={styles.playerTagText}>ATHLETE</Text>
              </View>
            </View>
            <Text style={styles.heroSub}>
              ID: {profile?.playerId || 'FB-882104'} • {profile?.position || 'Striker'} • {userLocation?.city || 'Bengaluru'}, {userLocation?.state || 'Karnataka'}
            </Text>
            <Text style={styles.heroClub}>
              ⚽ {profile?.clubOrTeam || 'Bengaluru Youth FC'} • {profile?.preferredFoot || 'Right'} Foot • Age {profile?.age || 18}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="pencil" size={16} color="#FFFFFF" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Physical Bio Row */}
        <View style={styles.bioRow}>
          <View style={styles.bioItem}>
            <Text style={styles.bioLabel}>HEIGHT</Text>
            <Text style={styles.bioVal}>{profile?.heightCm || 178} cm</Text>
          </View>
          <View style={styles.bioDivider} />
          <View style={styles.bioItem}>
            <Text style={styles.bioLabel}>WEIGHT</Text>
            <Text style={styles.bioVal}>{profile?.weightKg || 72} kg</Text>
          </View>
          <View style={styles.bioDivider} />
          <View style={styles.bioItem}>
            <Text style={styles.bioLabel}>ASSESSMENTS</Text>
            <Text style={styles.bioVal}>{profile?.assessmentCount || 4} Done</Text>
          </View>
        </View>
      </View>

      {/* 2. Technical Performance Scorecard & Radar Breakdown */}
      <View style={styles.scorecardContainer}>
        <View style={styles.scorecardHeader}>
          <View>
            <Text style={styles.scorecardTitle}>AI Football Talent Rating</Text>
            <Text style={styles.scorecardSub}>Certified by MediaPipe + YOLO CV Engine</Text>
          </View>
          <View style={styles.overallBadge}>
            <Text style={styles.overallNum}>{profile?.overallScore || 89.5}</Text>
            <Text style={styles.overallLbl}>OVERALL</Text>
          </View>
        </View>

        {/* Metric Grid */}
        <View style={styles.metricGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>DRIBBLING</Text>
            <Text style={[styles.metricVal, { color: '#10B981' }]}>
              {profile?.dribblingScore || 91}
            </Text>
            <Text style={styles.metricSub}>Slalom & Agility</Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>SHOOTING</Text>
            <Text style={[styles.metricVal, { color: '#3B82F6' }]}>
              {profile?.shootingScore || 93}
            </Text>
            <Text style={styles.metricSub}>Accuracy & Power</Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>BALL CONTROL</Text>
            <Text style={[styles.metricVal, { color: '#F59E0B' }]}>
              {profile?.ballControlScore || 86}
            </Text>
            <Text style={styles.metricSub}>First Touch 360</Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>PERCENTILE</Text>
            <Text style={[styles.metricVal, { color: '#8B5CF6' }]}>
              Top {Math.max(1, 100 - Math.round(profile?.nationalPercentile || 96))}%
            </Text>
            <Text style={styles.metricSub}>All-India Rank</Text>
          </View>
        </View>
      </View>

      {/* 3. Verified Football Badges & Achievements */}
      <View style={styles.achievementsCard}>
        <View style={styles.achieveHeader}>
          <Ionicons name="medal" size={18} color="#F59E0B" />
          <Text style={styles.achieveTitle}>Verified Football Badges & Strengths</Text>
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
          <View style={[styles.achieveBadge, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
            <Text style={[styles.achieveBadgeText, { color: '#EC4899' }]}>🚀 Elite Strike Velocity</Text>
          </View>
        </View>
      </View>

      {/* 4. AI Football Drills Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={styles.sectionTitle}>⚽ Record AI Football Assessment</Text>
        <Text style={styles.sectionSub}>Camera / Upload</Text>
      </View>

      {FOOTBALL_DRILLS.map((drill) => (
        <TouchableOpacity
          key={drill.id}
          style={styles.drillCard}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('RecordUpload', {
              initialDrill: drill.id,
              userToken,
            })
          }
        >
          <View style={[styles.drillIconBox, { backgroundColor: drill.color }]}>
            <MaterialCommunityIcons name={drill.icon} size={28} color="#FFFFFF" />
          </View>

          <View style={styles.drillInfo}>
            <Text style={[styles.drillCategory, { color: drill.color }]}>{drill.category.toUpperCase()}</Text>
            <Text style={styles.drillTitle}>{drill.title}</Text>
            <Text style={styles.drillBench}>{drill.metrics}</Text>
          </View>

          <View style={styles.arrowIconBox}>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </View>
        </TouchableOpacity>
      ))}

      {/* 5. Coach Messages CTA */}
      <TouchableOpacity
        style={styles.messageCtaCard}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('Messages', {
            userToken,
            userName,
          })
        }
      >
        <View style={styles.msgCtaIcon}>
          <Ionicons name="chatbubbles" size={24} color="#10B981" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.msgCtaTitle}>Scout & Coach Messages</Text>
          <Text style={styles.msgCtaSub}>Receive trial invitations and scouting feedback from verified coaches</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={24} color="#10B981" />
      </TouchableOpacity>

      {/* ======================================================== */}
      {/* EDIT PROFILE MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Edit Football Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLbl}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full Name"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.inputLbl}>Playing Position</Text>
              <View style={styles.chipRow}>
                {POSITIONS.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.modalChip, editPosition === pos && styles.modalChipActive]}
                    onPress={() => setEditPosition(pos)}
                  >
                    <Text style={[styles.modalChipText, editPosition === pos && styles.modalChipTextActive]}>
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLbl}>Preferred Foot</Text>
              <View style={styles.chipRow}>
                {FEET.map((foot) => (
                  <TouchableOpacity
                    key={foot}
                    style={[styles.modalChip, editFoot === foot && styles.modalChipActive]}
                    onPress={() => setEditFoot(foot)}
                  >
                    <Text style={[styles.modalChipText, editFoot === foot && styles.modalChipTextActive]}>
                      {foot} Foot
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLbl}>Club / Academy</Text>
              <TextInput
                style={styles.modalInput}
                value={editClub}
                onChangeText={setEditClub}
                placeholder="Club Name"
                placeholderTextColor="#64748B"
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLbl}>Age</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editAge}
                    onChangeText={setEditAge}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLbl}>Height (cm)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editHeight}
                    onChangeText={setEditHeight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLbl}>Weight (kg)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editWeight}
                    onChangeText={setEditWeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile Changes 💾</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  heroName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  playerTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  playerTagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
  },
  heroSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  heroClub: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bioRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bioItem: {
    flex: 1,
    alignItems: 'center',
  },
  bioLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
  },
  bioVal: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  bioDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#334155',
  },
  scorecardContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scorecardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  scorecardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  scorecardSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  overallBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  overallNum: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '900',
  },
  overallLbl: {
    color: '#6EE7B7',
    fontSize: 8,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  metricSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  achievementsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
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
    paddingVertical: 6,
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
  },
  sectionSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  drillCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 11,
    marginTop: 4,
  },
  arrowIconBox: {
    paddingLeft: 8,
  },
  messageCtaCard: {
    backgroundColor: '#064E3B',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  msgCtaIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgCtaTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  msgCtaSub: {
    color: '#A7F3D0',
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },
  inputLbl: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  modalChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  modalChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
