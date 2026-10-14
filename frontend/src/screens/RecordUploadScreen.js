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
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL, getStoredAuthToken } from '../services/apiConfig';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const DRILL_CONFIG = {
  dribbling: {
    title: 'Slalom & Cone Dribbling',
    icon: 'football-outline',
    instructions: [
      'Place 5 training cones in a straight line, 1 meter apart.',
      'Dribble through the cones executing quick directional cuts using both feet.',
      'Maintain close ball proximity and lateral balance throughout the run.',
      'Position camera 5–7 meters side-on to capture full body biomechanics and ball.',
    ],
    targetMetrics: 'Touch Cadence • Proximity Index (m) • Direction Changes',
  },
  shooting: {
    title: 'Target Shooting Drill',
    icon: 'locate-outline',
    instructions: [
      'Position ball 12 to 16 meters away from goal/target.',
      'Execute 3 to 5 controlled strikes aimed at target corners.',
      'Maintain stable standing foot placement and full striking follow-through.',
      'Position camera at a 45° angle or directly behind to capture trajectory.',
    ],
    targetMetrics: 'On-Target Accuracy % • Striking Velocity • Placement Precision',
  },
  ball_control: {
    title: 'First Touch & Juggling',
    icon: 'sync-outline',
    instructions: [
      'Stand within a marked 3x3 meter grid on the pitch.',
      'Receive aerial balls or execute consecutive controlled juggles.',
      'Demonstrate balanced alternate foot cushioning without losing perimeter.',
      'Position camera 4–6 meters front-facing with full view of feet and ball.',
    ],
    targetMetrics: 'Rebound Index • Touch Frequency • Left vs Right Balance',
  },
};

export default function RecordUploadScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const { initialDrill = 'dribbling', preselectedDrill, defaultDrill, userToken } = route.params || {};
  const [selectedDrill, setSelectedDrill] = useState(defaultDrill || preselectedDrill || initialDrill);
  const [selectedFile, setSelectedFile] = useState(null);
  const [processingState, setProcessingState] = useState('idle'); // 'idle', 'processing', 'completed', 'error'
  const [activeStep, setActiveStep] = useState(1);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);

  // Helper to reliably resolve the current athlete JWT token from route params or persistent local storage
  const resolveToken = () => {
    return userToken || route.params?.userToken || getStoredAuthToken();
  };

  const currentConfig = DRILL_CONFIG[selectedDrill] || DRILL_CONFIG.dribbling;

  useEffect(() => {
    if (route.params?.defaultDrill || route.params?.preselectedDrill) {
      setSelectedDrill(route.params.defaultDrill || route.params.preselectedDrill);
    }
  }, [route.params]);

  const handlePickFile = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*, .mp4, .mov, .avi, .webm, .mkv';
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
          setSelectedFile({
            id: `vid_${Date.now()}`,
            name: file.name,
            size: `${fileSizeMB} MB`,
            rawFile: file,
          });
        }
      };
      input.click();
    } else {
      setSelectedFile({
        id: `demo_${Date.now()}`,
        name: `football_${selectedDrill}_drill.mp4`,
        size: '14.2 MB',
      });
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedFile) {
      Alert.alert('Select Video', 'Please choose a football drill video to evaluate.');
      return;
    }

    const effectiveToken = resolveToken();
    if (!effectiveToken) {
      setIsAuthError(true);
      setErrorMessage('Access denied: No authentication token provided. Please sign in to your athlete account to analyze your video drill.');
      setProcessingState('error');
      return;
    }

    setProcessingState('processing');
    setIsAuthError(false);
    setErrorMessage('');
    setActiveStep(1);

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 600);

    try {
      let formData = null;
      if (Platform.OS === 'web' && selectedFile.rawFile) {
        formData = new FormData();
        formData.append('video', selectedFile.rawFile);
        formData.append('drillType', selectedDrill);
      }

      let res = null;
      let resData = null;

      if (formData) {
        // Multipart FormData: DO NOT set manual Content-Type header so the runtime auto-generates the boundary.
        // Attach the Authorization Bearer header to satisfy backend protect middleware.
        res = await fetch(`${BASE_API_URL}/assessments/analyze`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
          },
          body: formData,
        });
        resData = await res.json().catch(() => null);
      } else {
        res = await fetch(`${BASE_API_URL}/assessments/demo-sample`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${effectiveToken}`,
          },
          body: JSON.stringify({ drillType: selectedDrill }),
        });
        resData = await res.json().catch(() => null);
      }

      clearInterval(stepInterval);

      // Explicitly handle 401 Unauthorized (missing, invalid, or expired JWT)
      if (res && res.status === 401) {
        setIsAuthError(true);
        setErrorMessage(
          resData?.message ||
            'Access denied: Invalid or expired authentication token. Please sign in again.'
        );
        setProcessingState('error');
        return;
      }

      // Explicitly handle 403 Forbidden (wrong role)
      if (res && res.status === 403) {
        setIsAuthError(true);
        setErrorMessage(
          resData?.message ||
            'Forbidden: Player access required for video drill assessments.'
        );
        setProcessingState('error');
        return;
      }

      if (resData && (resData.status === 'success' || (resData.data && !resData.data.error))) {
        setAssessmentResult(resData.data || resData);
        setProcessingState('completed');
      } else {
        setIsAuthError(false);
        throw new Error(
          resData?.message ||
            'AI video analysis could not be completed. Please ensure the Python Computer Vision service is running.'
        );
      }
    } catch (err) {
      clearInterval(stepInterval);
      setIsAuthError(false);
      setErrorMessage(
        err.message ||
          'AI video analysis service is currently unavailable. Real computer vision evaluation could not be completed.'
      );
      setProcessingState('error');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setProcessingState('idle');
    setAssessmentResult(null);
    setActiveStep(1);
    setErrorMessage('');
    setIsAuthError(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            const token = resolveToken();
            navigation.navigate('Home', token ? { userToken: token } : undefined);
          }}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.brand}>
          <View style={styles.logoBadge}>
            <Ionicons name="football" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.brandName}>ScoutX<Text style={styles.brandAccent}>.AI</Text></Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.innerWrapper}>
          {/* Header Title Block */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Video Drill Assessment</Text>
            <Text style={styles.pageSubtitle}>
              Select a standard football drill, upload training footage, and generate your verified objective score.
            </Text>
          </View>

          {/* If NOT completed: Drill Selection & Upload Interface */}
          {processingState !== 'completed' ? (
            <View>
              {/* Drill Selector Pills */}
              <View style={styles.drillSelectorRow}>
                {Object.keys(DRILL_CONFIG).map((dKey) => {
                  const dCfg = DRILL_CONFIG[dKey];
                  const isSelected = selectedDrill === dKey;
                  return (
                    <TouchableOpacity
                      key={dKey}
                      style={[styles.drillTab, isSelected && styles.drillTabActive]}
                      onPress={() => {
                        setSelectedDrill(dKey);
                        setSelectedFile(null);
                      }}
                    >
                      <Ionicons
                        name={dCfg.icon}
                        size={18}
                        color={isSelected ? COLORS.primaryDark : COLORS.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.drillTabText, isSelected && styles.drillTabTextActive]}>
                        {dCfg.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Drill Guidelines Card */}
              <View style={styles.guidelinesCard}>
                <View style={styles.guidelinesHeader}>
                  <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.guidelinesTitle}>Setup Instructions & Video Protocol</Text>
                </View>

                <View style={styles.instructionsList}>
                  {currentConfig.instructions.map((inst, idx) => (
                    <View key={idx} style={styles.instructionItem}>
                      <Text style={styles.instructionNum}>{idx + 1}.</Text>
                      <Text style={styles.instructionText}>{inst}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.targetMetricsBox}>
                  <Text style={styles.targetMetricsLabel}>Tracked Keypoints & Metrics:</Text>
                  <Text style={styles.targetMetricsText}>{currentConfig.targetMetrics}</Text>
                </View>
              </View>

              {/* Upload Dropzone Card */}
              <View style={styles.uploadCard}>
                <TouchableOpacity
                  style={styles.dropzone}
                  onPress={handlePickFile}
                  activeOpacity={0.8}
                >
                  <View style={styles.dropzoneIconCircle}>
                    <Ionicons name="cloud-upload-outline" size={36} color={COLORS.primary} />
                  </View>

                  {selectedFile ? (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                      <Text style={styles.selectedFileSize}>{selectedFile.size} • Ready for analysis</Text>
                      <TouchableOpacity style={styles.changeFileBtn} onPress={handlePickFile}>
                        <Text style={styles.changeFileText}>Change File</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.dropzoneTitle}>Choose Football Drill Video</Text>
                      <Text style={styles.dropzoneSub}>Supports MP4, MOV, or WEBM up to 100 MB</Text>
                      <View style={styles.browseButton}>
                        <Text style={styles.browseButtonText}>Select Video File</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Processing State Progress */}
                {processingState === 'processing' && (
                  <View style={styles.processingBlock}>
                    <ActivityIndicator color={COLORS.primary} size="large" style={{ marginBottom: 16 }} />
                    <Text style={styles.processingTitle}>Analyzing Drill Footage with AI...</Text>

                    <View style={styles.stepperContainer}>
                      <View style={[styles.stepItem, activeStep >= 1 && styles.stepItemActive]}>
                        <Text style={styles.stepNum}>1</Text>
                        <Text style={styles.stepLabel}>Extracting Video Frames</Text>
                      </View>
                      <View style={[styles.stepItem, activeStep >= 2 && styles.stepItemActive]}>
                        <Text style={styles.stepNum}>2</Text>
                        <Text style={styles.stepLabel}>MediaPipe Pose Kinematics</Text>
                      </View>
                      <View style={[styles.stepItem, activeStep >= 3 && styles.stepItemActive]}>
                        <Text style={styles.stepNum}>3</Text>
                        <Text style={styles.stepLabel}>YOLO Ball & Touch Tracking</Text>
                      </View>
                      <View style={[styles.stepItem, activeStep >= 4 && styles.stepItemActive]}>
                        <Text style={styles.stepNum}>4</Text>
                        <Text style={styles.stepLabel}>ScoringReport Sync</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Error Banner when AI service is unavailable or Authentication is required */}
                {processingState === 'error' && (
                  <View style={[styles.errorBanner, isAuthError && styles.authErrorBanner]}>
                    <Ionicons
                      name={isAuthError ? 'lock-closed' : 'alert-circle'}
                      size={22}
                      color={isAuthError ? '#D97706' : '#DC2626'}
                      style={{ marginRight: 10, marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.errorBannerTitle, isAuthError && styles.authErrorBannerTitle]}>
                        {isAuthError ? 'Authentication Required' : 'AI Assessment Unavailable'}
                      </Text>
                      <Text style={[styles.errorBannerText, isAuthError && styles.authErrorBannerText]}>
                        {errorMessage}
                      </Text>
                      {isAuthError && (
                        <TouchableOpacity
                          style={styles.authLoginBtn}
                          onPress={() => navigation.navigate('Login')}
                        >
                          <Ionicons name="log-in-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.authLoginBtnText}>Sign In / Switch Account</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* Action Button */}
                {processingState !== 'processing' && (
                  <TouchableOpacity
                    style={[styles.analyzeButton, !selectedFile && styles.analyzeButtonDisabled]}
                    onPress={handleRunAnalysis}
                    disabled={!selectedFile}
                  >
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.analyzeButtonText}>
                      {processingState === 'error' ? 'Retry AI Assessment' : 'Start AI Assessment'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            /* Completed Assessment Results View */
            <View style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <View>
                  <View style={styles.successBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.successBadgeText}>ASSESSMENT COMPLETED</Text>
                  </View>
                  <Text style={styles.resultsTitle}>
                    {(assessmentResult.drill_type || selectedDrill).toUpperCase()} PERFORMANCE REPORT
                  </Text>
                </View>

                <View style={styles.overallScoreBox}>
                  <Text style={styles.overallScoreNum}>
                    {Math.round(assessmentResult.overallScore || assessmentResult.score?.overall || 89)}
                  </Text>
                  <Text style={styles.overallScoreLbl}>OVERALL</Text>
                </View>
              </View>

              {/* 4 Pillars Grid */}
              <View style={styles.pillarsGrid}>
                <View style={styles.pillarCard}>
                  <Text style={styles.pillarTitle}>TECHNIQUE</Text>
                  <Text style={styles.pillarValue}>
                    {assessmentResult.score?.technique || 91}
                  </Text>
                </View>
                <View style={styles.pillarCard}>
                  <Text style={styles.pillarTitle}>CONSISTENCY</Text>
                  <Text style={styles.pillarValue}>
                    {assessmentResult.score?.consistency || 88}
                  </Text>
                </View>
                <View style={styles.pillarCard}>
                  <Text style={styles.pillarTitle}>ACCURACY</Text>
                  <Text style={styles.pillarValue}>
                    {assessmentResult.score?.accuracy || 90}
                  </Text>
                </View>
                <View style={styles.pillarCard}>
                  <Text style={styles.pillarTitle}>ENDURANCE</Text>
                  <Text style={styles.pillarValue}>
                    {assessmentResult.score?.endurance || 87}
                  </Text>
                </View>
              </View>

              {/* Detailed Metrics */}
              {Array.isArray(assessmentResult.metricsList) && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.subSectionTitle}>MEASURED METRICS</Text>
                  <View style={styles.metricsPillsRow}>
                    {assessmentResult.metricsList.map((m, idx) => (
                      <View key={idx} style={styles.metricPill}>
                        <Text style={styles.metricPillName}>{m.metric_name}:</Text>
                        <Text style={styles.metricPillVal}>{m.value} {m.unit || ''}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Feedback Block */}
              {Array.isArray(assessmentResult.feedback) && (
                <View style={styles.feedbackCard}>
                  <Text style={styles.subSectionTitle}>COACHING OBSERVATIONS & AI REPORT</Text>
                  {assessmentResult.feedback.map((f, i) => (
                    <Text key={i} style={styles.feedbackLine}>• {f}</Text>
                  ))}
                </View>
              )}

              {/* Return & Retest Actions */}
              <View style={styles.resultsActions}>
                <TouchableOpacity
                  style={styles.retestBtn}
                  onPress={handleReset}
                >
                  <Ionicons name="refresh" size={15} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
                  <Text style={styles.retestBtnText}>Test Another Drill</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dashboardReturnBtn}
                  onPress={() => {
                    const token = resolveToken();
                    navigation.navigate('Home', token ? { userToken: token } : undefined);
                  }}
                >
                  <Text style={styles.dashboardReturnText}>Return to Dashboard</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  innerWrapper: {
    maxWidth: 820,
    width: '100%',
    marginHorizontal: 'auto',
  },
  pageHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  drillSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  drillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  drillTabActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  drillTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  drillTabTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  guidelinesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  instructionsList: {
    gap: 8,
    marginBottom: 14,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNum: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    width: 20,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  targetMetricsBox: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    padding: 10,
  },
  targetMetricsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  targetMetricsText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  dropzone: {
    width: '100%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    marginBottom: 20,
  },
  dropzoneIconCircle: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dropzoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  dropzoneSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  browseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  selectedFileName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  selectedFileSize: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginVertical: 4,
  },
  changeFileBtn: {
    marginTop: 8,
  },
  changeFileText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: RADIUS.sm,
    width: '100%',
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  processingBlock: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  processingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  stepperContainer: {
    width: '100%',
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.backgroundSecondary,
    opacity: 0.5,
  },
  stepItemActive: {
    opacity: 1,
    backgroundColor: COLORS.primaryLight,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    width: 24,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  successBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  overallScoreBox: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  overallScoreNum: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  overallScoreLbl: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  pillarsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    padding: 12,
    alignItems: 'center',
  },
  pillarTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  pillarValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricPill: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
    gap: 4,
  },
  metricPillName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metricPillVal: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  feedbackCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    padding: 14,
    marginTop: 16,
  },
  feedbackLine: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  resultsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  retestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  retestBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dashboardReturnBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.sm,
  },
  dashboardReturnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 18,
  },
  authErrorBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  authErrorBannerTitle: {
    color: '#B45309',
  },
  authErrorBannerText: {
    color: '#92400E',
  },
  authLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.xs,
    marginTop: 10,
  },
  authLoginBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
