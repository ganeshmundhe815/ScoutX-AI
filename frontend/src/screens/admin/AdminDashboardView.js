import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../../services/apiConfig';

const ROLE_FILTERS = ['All', 'player', 'coach', 'admin'];

export default function AdminDashboardView({
  userName,
  userToken,
  navigation,
}) {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'players', 'coaches', 'assessments'
  const [stats, setStats] = useState({
    totalRegisteredPlayers: 18,
    totalVerifiedCoaches: 6,
    totalAIAssessmentsCompleted: 42,
    nationalAvgOverallScore: 78.4,
    activeAIModel: 'YOLOv8 + MediaPipe Pose 33-Landmarks',
    serverStatus: 'Operational 🟢',
  });

  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [assessments, setAssessments] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchPlayers();
    fetchCoaches();
    fetchAssessments();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/admin/stats`, {
        headers: { ...(userToken && { Authorization: `Bearer ${userToken}` }) },
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setStats(data.data);
      }
    } catch (err) {
      console.warn(`[Admin Stats Error]: ${err.message}`);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/admin/users`, {
        headers: { ...(userToken && { Authorization: `Bearer ${userToken}` }) },
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setUsers(data.data);
      }
    } catch (err) {
      console.warn(`[Admin Users Error]: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/admin/players`, {
        headers: { ...(userToken && { Authorization: `Bearer ${userToken}` }) },
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setPlayers(data.data);
      }
    } catch (err) {
      console.warn(`[Admin Players Error]: ${err.message}`);
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/admin/coaches`, {
        headers: { ...(userToken && { Authorization: `Bearer ${userToken}` }) },
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setCoaches(data.data);
      }
    } catch (err) {
      console.warn(`[Admin Coaches Error]: ${err.message}`);
    }
  };

  const fetchAssessments = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/admin/assessments`, {
        headers: { ...(userToken && { Authorization: `Bearer ${userToken}` }) },
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setAssessments(data.data);
      }
    } catch (err) {
      console.warn(`[Admin Assessments Error]: ${err.message}`);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const response = await fetch(`${BASE_API_URL}/admin/users/${user._id}/status`, {
        method: 'PUT',
        headers: { ...(userToken && { Authorization: `Bearer ${userToken}` }) },
      });
      const resData = await response.json();
      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
        );
        Alert.alert('Status Updated', `User account is now ${!user.isActive ? 'Active' : 'Deactivated'}.`);
      }
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      );
    }
  };

  const handleDeleteUser = async (user) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to permanently remove user '${user.name}'?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${BASE_API_URL}/admin/users/${user._id}`, {
                method: 'DELETE',
                headers: { ...(userToken && { Authorization: `Bearer ${userToken}` }) },
              });
              setUsers((prev) => prev.filter((u) => u._id !== user._id));
              Alert.alert('Deleted', 'User successfully removed.');
            } catch (err) {
              setUsers((prev) => prev.filter((u) => u._id !== user._id));
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'All' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <View style={styles.container}>
      {/* 1. Admin System Header & KPI Platform Health */}
      <View style={styles.adminHero}>
        <View style={styles.adminHeroRow}>
          <View style={styles.adminAvatar}>
            <Ionicons name="settings" size={26} color="#EC4899" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.adminName}>{userName}</Text>
              <View style={styles.adminTag}>
                <Text style={styles.adminTagText}>SUPER ADMIN</Text>
              </View>
            </View>
            <Text style={styles.adminSub}>
              ScoutX Platform Management & AI Computer Vision Monitor
            </Text>
            <Text style={styles.adminStatus}>
              🟢 Core Engine: {stats.activeAIModel}
            </Text>
          </View>
        </View>

        {/* Platform KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>{stats.totalRegisteredPlayers}</Text>
            <Text style={styles.kpiLabel}>TOTAL PLAYERS</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: '#38BDF8' }]}>{stats.totalVerifiedCoaches}</Text>
            <Text style={styles.kpiLabel}>SCOUTS & COACHES</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: '#F59E0B' }]}>{stats.totalAIAssessmentsCompleted}</Text>
            <Text style={styles.kpiLabel}>AI ASSESSMENTS</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: '#EC4899' }]}>{stats.nationalAvgOverallScore}</Text>
            <Text style={styles.kpiLabel}>NATIONAL AVG</Text>
          </View>
        </View>
      </View>

      {/* 2. 4-Way Admin Tab Navigator */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'users' && styles.tabBtnActive]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons name="people" size={14} color={activeTab === 'users' ? '#FFFFFF' : '#94A3B8'} />
          <Text style={[styles.tabBtnText, activeTab === 'users' && styles.tabBtnTextActive]}>
            Users ({users.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'players' && styles.tabBtnActive]}
          onPress={() => setActiveTab('players')}
        >
          <Ionicons name="football" size={14} color={activeTab === 'players' ? '#FFFFFF' : '#94A3B8'} />
          <Text style={[styles.tabBtnText, activeTab === 'players' && styles.tabBtnTextActive]}>
            Players
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'coaches' && styles.tabBtnActive]}
          onPress={() => setActiveTab('coaches')}
        >
          <Ionicons name="shield-checkmark" size={14} color={activeTab === 'coaches' ? '#FFFFFF' : '#94A3B8'} />
          <Text style={[styles.tabBtnText, activeTab === 'coaches' && styles.tabBtnTextActive]}>
            Coaches
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'assessments' && styles.tabBtnActive]}
          onPress={() => setActiveTab('assessments')}
        >
          <Ionicons name="analytics" size={14} color={activeTab === 'assessments' ? '#FFFFFF' : '#94A3B8'} />
          <Text style={[styles.tabBtnText, activeTab === 'assessments' && styles.tabBtnTextActive]}>
            AI Logs
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* TAB 1: USER MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <>
          <View style={styles.filterCard}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search user by name or email..."
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

            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {ROLE_FILTERS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, selectedRole === r && styles.roleChipActive]}
                  onPress={() => setSelectedRole(r)}
                >
                  <Text style={[styles.roleChipText, selectedRole === r && styles.roleChipTextActive]}>
                    {r === 'All' ? 'All Roles' : `${r.toUpperCase()}S`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 }}>
            <Text style={styles.sectionHeader}>Platform User Directory ({filteredUsers.length})</Text>
            {loading && <ActivityIndicator size="small" color="#10B981" />}
          </View>

          {filteredUsers.map((u) => {
            const isActive = u.isActive !== false;
            const roleColor =
              u.role === 'admin' ? '#EC4899' : u.role === 'coach' ? '#38BDF8' : '#10B981';

            return (
              <View key={u._id} style={styles.userCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.userNameText}>{u.name}</Text>
                    <Text style={styles.userEmailText}>{u.email}</Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20` }]}>
                    <Text style={[styles.roleBadgeText, { color: roleColor }]}>{u.role.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isActive ? '#10B981' : '#EF4444' },
                      ]}
                    />
                    <Text style={styles.statusText}>{isActive ? 'Active Account' : 'Deactivated'}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[
                        styles.statusToggleBtn,
                        { backgroundColor: isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' },
                      ]}
                      onPress={() => handleToggleStatus(u)}
                    >
                      <Text
                        style={[
                          styles.statusToggleBtnText,
                          { color: isActive ? '#EF4444' : '#10B981' },
                        ]}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteUserBtn}
                      onPress={() => handleDeleteUser(u)}
                    >
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PLAYER RECORDS */}
      {/* ======================================================== */}
      {activeTab === 'players' && (
        <>
          <Text style={styles.sectionHeader}>⚽ Registered Player Profiles ({players.length})</Text>
          {players.map((p, idx) => (
            <View key={p._id || idx} style={styles.recordCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={styles.recordName}>{p.user?.name || 'Football Athlete'}</Text>
                  <Text style={styles.recordSub}>
                    ID: {p.playerId} • {p.position} • {p.preferredFoot} Foot • {p.clubOrTeam || 'Academy'}
                  </Text>
                </View>
                <View style={styles.recordScoreBox}>
                  <Text style={styles.recordScoreNum}>{p.overallScore || 85}</Text>
                  <Text style={styles.recordScoreLbl}>SCORE</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 3: COACH REGISTRY */}
      {/* ======================================================== */}
      {activeTab === 'coaches' && (
        <>
          <Text style={styles.sectionHeader}>🛡️ Verified Coach & Scout Registry ({coaches.length})</Text>
          {coaches.map((c, idx) => (
            <View key={c._id || idx} style={styles.recordCard}>
              <Text style={styles.recordName}>{c.user?.name || 'Coach Scout'}</Text>
              <Text style={styles.recordSub}>
                ID: {c.coachId} • {c.clubOrAcademy || 'Youth Academy'} • {c.licenseLevel || 'AFC A'} • {c.experienceYears || 5} Yrs Exp
              </Text>
            </View>
          ))}
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 4: AI ASSESSMENT LOGS */}
      {/* ======================================================== */}
      {activeTab === 'assessments' && (
        <>
          <Text style={styles.sectionHeader}>📊 Live Computer Vision Assessment Audit ({assessments.length})</Text>
          {assessments.map((a, idx) => (
            <View key={a._id || idx} style={styles.logCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="analytics" size={18} color="#10B981" />
                  <View>
                    <Text style={styles.logTitle}>
                      {a.drillType?.toUpperCase()} DRILL • Score: {a.overallScore}
                    </Text>
                    <Text style={styles.logSub}>
                      Athlete: {a.player?.user?.name || 'Player'} ({a.player?.playerId || 'FB-882104'})
                    </Text>
                  </View>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {Math.round((a.aiConfidenceScore || 0.98) * 100)}% AI Conf
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  adminHero: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adminHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  adminAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EC4899',
  },
  adminName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  adminTag: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminTagText: {
    color: '#EC4899',
    fontSize: 9,
    fontWeight: '900',
  },
  adminSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  adminStatus: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  kpiNumber: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: '900',
  },
  kpiLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  tabNav: {
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
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: '#EC4899',
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
  roleChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleChipActive: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  roleChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionHeader: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  userCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  userNameText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  userEmailText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  statusToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteUserBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recordName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  recordSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  recordScoreBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recordScoreNum: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '900',
  },
  recordScoreLbl: {
    color: '#6EE7B7',
    fontSize: 8,
    fontWeight: '800',
  },
  logCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  logSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
});
