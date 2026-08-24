/**
 * ScoutX Football Autonomous Embedded Storage Engine:
 * Provides zero-config, in-memory football database operations
 * when MongoDB Atlas or Local MongoDB daemon is offline.
 */
class FootballEmbeddedStore {
  constructor() {
    this.users = [];
    this.playerProfiles = [];
    this.coachProfiles = [];
    this.footballAssessments = [];
    this.messages = [];
    this.seed();
  }

  seed() {
    // 1. Seed Football Players
    const p1User = {
      _id: 'usr_player_01',
      name: 'Sunil Chhetri Jr',
      email: 'player@scoutx.com',
      password: '$2a$10$eDummyHashedPasswordForDemoTestingOnly01',
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
      playerId: 'FB-882104',
      age: 18,
      position: 'Striker',
      preferredFoot: 'Right',
      heightCm: 178,
      weightKg: 72,
      clubOrTeam: 'Bengaluru Youth FC',
      overallScore: 89.5,
      dribblingScore: 91.0,
      shootingScore: 92.5,
      ballControlScore: 86.0,
      shotAccuracy: 88.0,
      estimatedPower: 85.0,
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
      name: 'Lallianzuala Changte Jr',
      email: 'winger@scoutx.com',
      password: '$2a$10$eDummyHashedPasswordForDemoTestingOnly02',
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
      playerId: 'FB-519203',
      age: 17,
      position: 'Winger',
      preferredFoot: 'Left',
      heightCm: 172,
      weightKg: 65,
      clubOrTeam: 'Mizoram Football Academy',
      overallScore: 87.0,
      dribblingScore: 94.0,
      shootingScore: 82.0,
      ballControlScore: 89.0,
      shotAccuracy: 81.0,
      estimatedPower: 78.0,
      nationalPercentile: 93.8,
      assessmentCount: 3,
      achievements: [
        { title: 'Speed Merchant', description: 'Sub-second change of direction in dribbling drill' },
      ],
      createdAt: new Date(),
    });

    // 2. Seed Football Coach
    const c1User = {
      _id: 'usr_coach_01',
      name: 'Coach Ranjan Patil',
      email: 'coach@scoutx.com',
      password: '$2a$10$eDummyHashedPasswordForDemoTestingOnly03',
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
      coachId: 'COACH-102941',
      clubOrAcademy: 'Mumbai City Youth Academy',
      licenseLevel: 'AFC A / UEFA A',
      experienceYears: 12,
      scoutingRegions: ['Maharashtra', 'Karnataka', 'Goa'],
      bio: 'Head Youth Scout looking for sharp wingers and clinical strikers.',
      shortlistedPlayers: [],
      createdAt: new Date(),
    });

    // 3. Seed Admin User
    const adminUser = {
      _id: 'usr_admin_01',
      name: 'ScoutX Football Admin',
      email: 'admin@scoutx.com',
      password: '$2a$10$eDummyHashedPasswordForDemoTestingOnly04',
      role: 'admin',
      phone: '9876543200',
      location: { state: 'Delhi', district: 'New Delhi', city: 'New Delhi' },
      isActive: true,
      createdAt: new Date(),
    };
    this.users.push(adminUser);
  }
}

const store = new FootballEmbeddedStore();
module.exports = store;
