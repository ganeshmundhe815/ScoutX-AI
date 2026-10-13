/**
 * ScoutX Football Autonomous Embedded Storage Engine (D2 — MONGODB In-Memory Mirror):
 * Provides zero-config, in-memory football database operations for all 7 ER Diagram Entities:
 * 1. USER       (PK user_id, name, email, password_hash, role)
 * 2. ATHLETE    (PK athlete_id, FK user_id, age, playing_position, city)
 * 3. COACH      (PK coach_id, FK user_id, coach_name / profile)
 * 4. SHORTLIST  (FK coach_id, FK athlete_id, note, created_at)
 * 5. ASSESSMENT (PK assessment_id, FK athlete_id, drill_type, video_url, status)
 * 6. METRIC     (PK metric_id, FK assessment_id, metric_name, value)
 * 7. SCORE      (PK score_id, FK assessment_id, technique, consistency, accuracy, endurance, overall)
 */
class FootballEmbeddedStore {
  constructor() {
    this.users = [];
    this.playerProfiles = [];
    this.coachProfiles = [];
    this.shortlists = [];
    this.footballAssessments = [];
    this.metrics = [];
    this.scores = [];
    this.messages = [];
    this.seed();
  }

  seed() {
    // 1. Seed Football Players (USER + ATHLETE)
    const p1User = {
      _id: 'usr_player_01',
      user_id: 'USR-100101',
      name: 'Sunil Chhetri Jr',
      email: 'player@scoutx.com',
      password: '$2a$10$eDummyHashedPasswordForDemoTestingOnly01',
      password_hash: '$2a$10$eDummyHashedPasswordForDemoTestingOnly01',
      role: 'player',
      phone: '9876543210',
      location: { state: 'Karnataka', district: 'Bengaluru', city: 'Bengaluru' },
      isActive: true,
      createdAt: new Date(),
    };
    this.users.push(p1User);

    this.playerProfiles.push({
      _id: 'prof_player_01',
      user: p1User._id,
      user_id: p1User._id,
      playerId: 'FB-882104',
      athlete_id: 'FB-882104',
      age: 18,
      position: 'Striker',
      playing_position: 'Striker',
      city: 'Bengaluru',
      preferredFoot: 'Right',
      heightCm: 178,
      weightKg: 72,
      clubOrTeam: 'Bengaluru Youth FC',
      overallScore: 90.0,
      dribblingScore: 91.0,
      shootingScore: 93.0,
      ballControlScore: 87.0,
      shotAccuracy: 89.0,
      estimatedPower: 86.0,
      scoreSummary: {
        technique: 91,
        consistency: 89,
        accuracy: 92,
        endurance: 88,
        overall: 90,
      },
      nationalPercentile: 96.4,
      assessmentCount: 4,
      achievements: [
        { title: 'Top Scorer 2025', description: 'Scored 15 goals in Regional Youth League' },
        { title: 'AI 90+ Shooting Accuracy', description: 'Achieved 92% shot on target score' },
      ],
      createdAt: new Date(),
    });

    const p2User = {
      _id: 'usr_player_02',
      user_id: 'USR-100102',
      name: 'Lallianzuala Changte Jr',
      email: 'winger@scoutx.com',
      password: '$2a$10$eDummyHashedPasswordForDemoTestingOnly02',
      password_hash: '$2a$10$eDummyHashedPasswordForDemoTestingOnly02',
      role: 'player',
      phone: '9876543211',
      location: { state: 'Mizoram', district: 'Aizawl', city: 'Aizawl' },
      isActive: true,
      createdAt: new Date(),
    };
    this.users.push(p2User);

    this.playerProfiles.push({
      _id: 'prof_player_02',
      user: p2User._id,
      user_id: p2User._id,
      playerId: 'FB-519203',
      athlete_id: 'FB-519203',
      age: 17,
      position: 'Winger',
      playing_position: 'Winger',
      city: 'Aizawl',
      preferredFoot: 'Left',
      heightCm: 172,
      weightKg: 65,
      clubOrTeam: 'Mizoram Football Academy',
      overallScore: 88.0,
      dribblingScore: 94.0,
      shootingScore: 83.0,
      ballControlScore: 89.0,
      shotAccuracy: 82.0,
      estimatedPower: 80.0,
      scoreSummary: {
        technique: 93,
        consistency: 88,
        accuracy: 83,
        endurance: 89,
        overall: 88,
      },
      nationalPercentile: 93.8,
      assessmentCount: 3,
      achievements: [
        { title: 'Speed Merchant', description: 'Sub-second change of direction in dribbling drill' },
      ],
      createdAt: new Date(),
    });

    const p3User = {
      _id: 'usr_player_03',
      user_id: 'USR-100103',
      name: 'Sahal Abdul Samad Jr',
      email: 'midfielder@scoutx.com',
      password: '$2a$10$eDummyHashedPasswordForDemoTestingOnly05',
      password_hash: '$2a$10$eDummyHashedPasswordForDemoTestingOnly05',
      role: 'player',
      phone: '9876543215',
      location: { state: 'Kerala', district: 'Kochi', city: 'Kochi' },
      isActive: true,
      createdAt: new Date(),
    };
    this.users.push(p3User);

    this.playerProfiles.push({
      _id: 'prof_player_03',
      user: p3User._id,
      user_id: p3User._id,
      playerId: 'FB-992101',
      athlete_id: 'FB-992101',
      age: 19,
      position: 'Attacking Midfielder',
      playing_position: 'Attacking Midfielder',
      city: 'Kochi',
      preferredFoot: 'Right',
      heightCm: 176,
      weightKg: 69,
      clubOrTeam: 'Kerala Blasters Reserve',
      overallScore: 86.5,
      dribblingScore: 90.0,
      shootingScore: 81.0,
      ballControlScore: 92.0,
      shotAccuracy: 84.0,
      estimatedPower: 79.0,
      scoreSummary: {
        technique: 91,
        consistency: 90,
        accuracy: 84,
        endurance: 82,
        overall: 87,
      },
      nationalPercentile: 91.5,
      assessmentCount: 3,
      achievements: [
        { title: 'First Touch Maestro', description: '92% rebound control index' },
      ],
      createdAt: new Date(),
    });

    // 2. Seed Football Coach (USER + COACH)
    const c1User = {
      _id: 'usr_coach_01',
      user_id: 'USR-200101',
      name: 'Coach Ranjan Patil',
      email: 'coach@scoutx.com',
      password: '$2a$10$eDummyHashedPasswordForDemoTestingOnly03',
      password_hash: '$2a$10$eDummyHashedPasswordForDemoTestingOnly03',
      role: 'coach',
      phone: '9876543212',
      location: { state: 'Maharashtra', district: 'Mumbai', city: 'Mumbai' },
      isActive: true,
      createdAt: new Date(),
    };
    this.users.push(c1User);

    this.coachProfiles.push({
      _id: 'prof_coach_01',
      user: c1User._id,
      user_id: c1User._id,
      coachId: 'COACH-102941',
      coach_id: 'COACH-102941',
      coach_name: 'Coach Ranjan Patil',
      clubOrAcademy: 'Mumbai City Youth Academy',
      licenseLevel: 'AFC A / UEFA A',
      experienceYears: 12,
      scoutingRegions: ['Maharashtra', 'Karnataka', 'Goa', 'Mizoram', 'Kerala'],
      bio: 'Head Youth Scout looking for sharp wingers and clinical strikers.',
      shortlistedPlayers: [
        {
          _id: 'sl_01',
          shortlist_id: 'SL-401290',
          coach_id: 'COACH-102941',
          athlete_id: 'FB-882104',
          player: this.playerProfiles[0],
          note: 'Clinical striker with 92% on-target accuracy. Invite for Mumbai U-19 trials.',
          notes: 'Clinical striker with 92% on-target accuracy. Invite for Mumbai U-19 trials.',
          created_at: new Date(Date.now() - 86400000),
          addedAt: new Date(Date.now() - 86400000),
        },
      ],
      createdAt: new Date(),
    });

    // Seed SHORTLIST Entity
    this.shortlists.push({
      _id: 'sl_01',
      shortlist_id: 'SL-401290',
      coach_id: 'COACH-102941',
      athlete_id: 'FB-882104',
      note: 'Clinical striker with 92% on-target accuracy. Invite for Mumbai U-19 trials.',
      created_at: new Date(Date.now() - 86400000),
    });

    // 3. Seed Admin User
    const adminUser = {
      _id: 'usr_admin_01',
      user_id: 'USR-900001',
      name: 'ScoutX Football Admin',
      email: 'admin@scoutx.com',
      password: '$2a$10$eDummyHashedPasswordForDemoTestingOnly04',
      password_hash: '$2a$10$eDummyHashedPasswordForDemoTestingOnly04',
      role: 'admin',
      phone: '9876543200',
      location: { state: 'Delhi', district: 'New Delhi', city: 'New Delhi' },
      isActive: true,
      createdAt: new Date(),
    };
    this.users.push(adminUser);

    // 4. Seed Initial Assessments, Scores (1:1), and Metrics (1:N)
    const sampleScore1 = {
      score_id: 'SCR-701001',
      assessment_id: 'ASM-501001',
      technique: 91,
      consistency: 89,
      accuracy: 93,
      endurance: 88,
      overall: 90,
    };
    const sampleMetrics1 = [
      { metric_id: 'MET-80101', assessment_id: 'ASM-501001', metric_name: 'on_target_accuracy', value: 92.5, unit: '%' },
      { metric_id: 'MET-80102', assessment_id: 'ASM-501001', metric_name: 'estimated_power', value: 88.0, unit: 'km/h idx' },
      { metric_id: 'MET-80103', assessment_id: 'ASM-501001', metric_name: 'ball_touches', value: 14, unit: 'touches' },
      { metric_id: 'MET-80104', assessment_id: 'ASM-501001', metric_name: 'control_consistency', value: 89.0, unit: '%' },
      { metric_id: 'MET-80105', assessment_id: 'ASM-501001', metric_name: 'duration_sec', value: 11.2, unit: 's' },
    ];

    this.scores.push(sampleScore1);
    this.metrics.push(...sampleMetrics1);

    this.footballAssessments.push({
      _id: 'asm_seed_01',
      assessment_id: 'ASM-501001',
      player: 'prof_player_01',
      athlete_id: 'FB-882104',
      drillType: 'shooting',
      drill_type: 'shooting',
      videoUrl: '/uploads/sample_shooting_drill.mp4',
      video_url: '/uploads/sample_shooting_drill.mp4',
      status: 'completed',
      overallScore: 90,
      score: sampleScore1,
      metricsList: sampleMetrics1,
      dribbling: { score: 88, durationSec: 11.2, ballTouches: 14, controlConsistency: 89, avgPlayerBallDistance: 0.38, directionChanges: 5 },
      shooting: { score: 93, shotsCount: 5, onTargetAccuracy: 92.5, goalsDetected: 4, estimatedPower: 88, shotDirection: 'Top-Right Corner' },
      ballControl: { score: 87, touchesCount: 24, playerBallDistance: 0.35, controlConsistency: 89, reboundControlScore: 87 },
      footUsage: { leftFootTouches: 4, rightFootTouches: 10, leftFootPercentage: 29, rightFootPercentage: 71, preferredFoot: 'Right' },
      feedback: [
        '[P3 → P4 AI Report] Clinical finishing velocity and top-corner placement detected.',
        'SCORE Breakdown — Technique: 91 | Consistency: 89 | Accuracy: 93 | Endurance: 88.',
      ],
      confidenceScore: 0.98,
      createdAt: new Date(Date.now() - 3600000 * 5),
    });

    const sampleScore2 = {
      score_id: 'SCR-701002',
      assessment_id: 'ASM-501002',
      technique: 94,
      consistency: 91,
      accuracy: 86,
      endurance: 92,
      overall: 91,
    };
    const sampleMetrics2 = [
      { metric_id: 'MET-80201', assessment_id: 'ASM-501002', metric_name: 'ball_touches', value: 19, unit: 'touches' },
      { metric_id: 'MET-80202', assessment_id: 'ASM-501002', metric_name: 'control_consistency', value: 91.5, unit: '%' },
      { metric_id: 'MET-80203', assessment_id: 'ASM-501002', metric_name: 'direction_changes', value: 7, unit: 'cuts' },
      { metric_id: 'MET-80204', assessment_id: 'ASM-501002', metric_name: 'avg_player_ball_distance', value: 0.31, unit: 'm' },
      { metric_id: 'MET-80205', assessment_id: 'ASM-501002', metric_name: 'duration_sec', value: 9.8, unit: 's' },
    ];

    this.scores.push(sampleScore2);
    this.metrics.push(...sampleMetrics2);

    this.footballAssessments.push({
      _id: 'asm_seed_02',
      assessment_id: 'ASM-501002',
      player: 'prof_player_01',
      athlete_id: 'FB-882104',
      drillType: 'dribbling',
      drill_type: 'dribbling',
      videoUrl: '/uploads/sample_dribbling_drill.mp4',
      video_url: '/uploads/sample_dribbling_drill.mp4',
      status: 'completed',
      overallScore: 91,
      score: sampleScore2,
      metricsList: sampleMetrics2,
      dribbling: { score: 91, durationSec: 9.8, ballTouches: 19, controlConsistency: 91.5, avgPlayerBallDistance: 0.31, directionChanges: 7 },
      shooting: { score: 86, shotsCount: 4, onTargetAccuracy: 85, goalsDetected: 3, estimatedPower: 84, shotDirection: 'Bottom-Left' },
      ballControl: { score: 89, touchesCount: 28, playerBallDistance: 0.31, controlConsistency: 91.5, reboundControlScore: 90 },
      footUsage: { leftFootTouches: 7, rightFootTouches: 12, leftFootPercentage: 37, rightFootPercentage: 63, preferredFoot: 'Right' },
      feedback: [
        '[P3 → P4 AI Report] Elite slalom agility with 0.31m close-ball control proximity.',
        'SCORE Breakdown — Technique: 94 | Consistency: 91 | Accuracy: 86 | Endurance: 92.',
      ],
      confidenceScore: 0.97,
      createdAt: new Date(Date.now() - 3600000 * 24),
    });
  }
}

const store = new FootballEmbeddedStore();
module.exports = store;
