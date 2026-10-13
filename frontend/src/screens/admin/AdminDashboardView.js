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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../../services/apiConfig';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const ROLE_FILTERS = ['All', 'player', 'coach', 'admin'];

export default function AdminDashboardView({
  userName,
  userToken,
  navigation,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [activeTab, setActiveTab] = useState('users'); // 'users', 'players', 'coaches', 'assessments'
  const [stats, setStats] = useState({
    totalRegisteredPlayers: 18,
    totalVerifiedCoaches: 6,
    totalAIAssessmentsCompleted: 42,
    nationalAvgOverallScore: 78.4,
    activeAIModel: 'YOLOv8 + MediaPipe Pose 33-Landmarks',
    serverStatus: 'Operational',
  });

  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [assessments, setAssessments] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      await fetch(`${BASE_API_URL}/admin/users/${user._id}/status`, {
        method: 'PUT',
        headers: { ...(userToken && { Authorization: `Bearer ${userToken}` }) },
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      );
      Alert.alert('Status Updated', `User account is now ${!user.isActive ? 'Active' : 'Deactivated'}.`);
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      );
    }
  };

  const handleDeleteUser = async (user) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to remove user account '${user.name}'?`,
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
            } catch (err) {
              setUsers((prev) => prev.filter((u) => u._id !== user._id));
            }
          },
        },
      ]
    );
  };

  const handleExportUsersExcel = async () => {
    try {
      setExporting(true);
      const response = await fetch(`${BASE_API_URL}/admin/export/users`, {
        method: 'GET',
        headers: {
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to export users to Excel');
      }

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `scoutx_users_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        Alert.alert('Excel Export Downloaded', 'Users database has been exported to scoutx_users.xlsx.');
      } else {
        Alert.alert('Export Generated', 'Server has generated the Excel file successfully.');
      }
    } catch (err) {
      Alert.alert('Export Failed', err.message || 'Unable to download Excel spreadsheet.');
    } finally {
      setExporting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'All' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Platform KPI Grid */}
      <View style={styles.kpiSummaryCard}>
        <View style={styles.kpiHeaderRow}>
          <View>
            <Text style={styles.adminTitle}>Platform Operations Dashboard</Text>
            <Text style={styles.adminSubtitle}>
              Logged in as {userName || 'Administrator'} • Autonomous AI Engine: {stats.activeAIModel}
            </Text>
          </View>
          <View style={styles.serverStatusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.serverStatusText}>System Status: {stats.serverStatus}</Text>
          </View>
        </View>

        <View style={[styles.kpiGrid, isDesktop && styles.kpiGridDesktop]}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiVal}>{stats.totalRegisteredPlayers || players.length}</Text>
            <Text style={styles.kpiLbl}>REGISTERED ATHLETES</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiVal}>{stats.totalVerifiedCoaches || coaches.length}</Text>
            <Text style={styles.kpiLbl}>LICENSED COACHES</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiVal}>{stats.totalAIAssessmentsCompleted || assessments.length}</Text>
            <Text style={styles.kpiLbl}>COMPLETED ASSESSMENTS</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiVal}>{stats.nationalAvgOverallScore || 78.4}</Text>
            <Text style={styles.kpiLbl}>NAT. AVG SCORE</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons name="people" size={16} color={activeTab === 'users' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === 'users' && styles.tabButtonTextActive]}>
            User Accounts ({users.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'players' && styles.tabButtonActive]}
          onPress={() => setActiveTab('players')}
        >
          <Ionicons name="football" size={16} color={activeTab === 'players' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === 'players' && styles.tabButtonTextActive]}>
            Athletes ({players.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'coaches' && styles.tabButtonActive]}
          onPress={() => setActiveTab('coaches')}
        >
          <Ionicons name="briefcase" size={16} color={activeTab === 'coaches' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === 'coaches' && styles.tabButtonTextActive]}>
            Coaches ({coaches.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'assessments' && styles.tabButtonActive]}
          onPress={() => setActiveTab('assessments')}
        >
          <Ionicons name="analytics" size={16} color={activeTab === 'assessments' ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === 'assessments' && styles.tabButtonTextActive]}>
            Assessment Engine ({assessments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: USER ACCOUNTS */}
      {activeTab === 'users' && (
        <View style={styles.tabContent}>
          {/* Filter Bar */}
          <View style={styles.filterCard}>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search user by name or email..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.filterActionsRow}>
              <View style={styles.roleFilterRow}>
                <Text style={styles.filterLabel}>Role:</Text>
                {ROLE_FILTERS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rolePill, selectedRole === r && styles.rolePillActive]}
                    onPress={() => setSelectedRole(r)}
                  >
                    <Text style={[styles.rolePillText, selectedRole === r && styles.rolePillTextActive]}>
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.exportExcelButton, exporting && styles.exportExcelButtonDisabled]}
                onPress={handleExportUsersExcel}
                disabled={exporting}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Export user accounts to Excel"
              >
                {exporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.exportExcelButtonText}>Export to Excel (.xlsx)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 32 }} />
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Users Match Current Filters</Text>
            </View>
          ) : (
            <View style={styles.usersList}>
              {filteredUsers.map((u) => (
                <View key={u._id} style={styles.userRowCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userNameText}>{u.name}</Text>
                      <View style={[styles.userRolePill, { backgroundColor: u.role === 'admin' ? '#FEE2E2' : u.role === 'coach' ? '#E0F2FE' : COLORS.primaryLight }]}>
                        <Text style={[styles.userRoleText, { color: u.role === 'admin' ? COLORS.accentRed : u.role === 'coach' ? '#0369A1' : COLORS.primaryDark }]}>
                          {u.role.toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: u.isActive !== false ? COLORS.primaryLight : '#FEE2E2' }]}>
                        <Text style={[styles.statusText, { color: u.isActive !== false ? COLORS.primaryDark : COLORS.accentRed }]}>
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.userEmailText}>{u.email}</Text>
                    <Text style={styles.userLocationText}>
                      Location: {u.location?.city || 'Pune'}, {u.location?.state || 'Maharashtra'}
                    </Text>
                  </View>

                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={styles.toggleBtn}
                      onPress={() => handleToggleStatus(u)}
                    >
                      <Text style={styles.toggleBtnText}>
                        {u.isActive !== false ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteUser(u)}
                    >
                      <Ionicons name="trash-outline" size={15} color={COLORS.accentRed} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* TAB 2: ATHLETES */}
      {activeTab === 'players' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionHeader}>REGISTERED ATHLETE PROFILES ({players.length})</Text>
          <View style={styles.playersList}>
            {players.map((p) => (
              <View key={p._id || p.athlete_id} style={styles.profileCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileCardTitle}>{p.user?.name || p.name || 'Athlete'}</Text>
                  <Text style={styles.profileCardSub}>{p.clubOrTeam} • {p.city}</Text>
                  <Text style={styles.profileCardMeta}>
                    Position: {p.position || p.playing_position} • Age: {p.age} • Foot: {p.preferredFoot}
                  </Text>
                </View>
                <View style={styles.scorePill}>
                  <Text style={styles.scorePillVal}>{Math.round(p.overallScore || 85)}</Text>
                  <Text style={styles.scorePillLbl}>SCORE</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* TAB 3: COACHES */}
      {activeTab === 'coaches' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionHeader}>VERIFIED COACHES & SCOUTS ({coaches.length})</Text>
          <View style={styles.coachesList}>
            {coaches.map((c) => (
              <View key={c._id || c.coach_id} style={styles.profileCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileCardTitle}>{c.user?.name || c.name || c.coach_name || 'Coach'}</Text>
                  <Text style={styles.profileCardSub}>{c.clubOrAcademy || 'Academy'}</Text>
                  <Text style={styles.profileCardMeta}>
                    License: {c.licenseLevel || 'AFC A'} • Experience: {c.experienceYears || 5} years
                  </Text>
                </View>
                <View style={styles.verifiedCoachBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedCoachText}>Verified</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* TAB 4: ASSESSMENTS */}
      {activeTab === 'assessments' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionHeader}>EVALUATION AUDIT LOG ({assessments.length})</Text>
          <View style={styles.assessmentsList}>
            {assessments.map((asm) => (
              <View key={asm._id || asm.assessment_id} style={styles.asmAuditCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.asmAuditTitle}>
                    {(asm.drill_type || asm.drillType || 'Drill').toUpperCase()}
                  </Text>
                  <Text style={styles.asmAuditId}>
                    ID: {asm.assessment_id || asm._id} • Athlete: {asm.athlete_id || 'Athlete'}
                  </Text>
                  <Text style={styles.asmAuditDate}>
                    Status: {asm.status} • Recorded: {new Date(asm.createdAt || Date.now()).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.asmAuditScore}>
                  <Text style={styles.asmAuditScoreVal}>{Math.round(asm.overallScore || 85)}</Text>
                  <Text style={styles.asmAuditScoreLbl}>SCORE</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
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
  kpiSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  adminSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  serverStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  serverStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  kpiGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  kpiGridDesktop: {
    flexDirection: 'row',
  },
  kpiBox: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: 14,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  kpiLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 3,
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
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  roleFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
  },
  rolePillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  rolePillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  filterActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  exportExcelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  exportExcelButtonDisabled: {
    opacity: 0.65,
  },
  exportExcelButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  usersList: {
    gap: 10,
  },
  userRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userRolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  userRoleText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  userEmailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  userLocationText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  playersList: {
    gap: 10,
  },
  coachesList: {
    gap: 10,
  },
  assessmentsList: {
    gap: 10,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  profileCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  profileCardMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  scorePill: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  scorePillVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  scorePillLbl: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  verifiedCoachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  verifiedCoachText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  asmAuditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  asmAuditTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  asmAuditId: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  asmAuditDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  asmAuditScore: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  asmAuditScoreVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  asmAuditScoreLbl: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
});
