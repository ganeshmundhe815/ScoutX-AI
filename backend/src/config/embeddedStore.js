/**
 * ScoutX Autonomous Embedded Storage Engine:
 * Provides zero-config, persistent in-memory database operations
 * when MongoDB Atlas or Local MongoDB daemon is offline.
 */
class EmbeddedStore {
  constructor() {
    this.users = [];
    this.athletes = [];
    this.performanceResults = [];
    this.coachFeedbacks = [];
    this.seed();
  }

  seed() {
    this.users.push({
      _id: 'usr_neeraj_01',
      name: 'Neeraj Kumar',
      email: 'neeraj@scoutx.com',
      password: '$2a$10$eDummyHashedPasswordForDemoTestingOnly01',
      role: 'athlete',
      state: 'Haryana',
      district: 'Panipat',
      phone: '9876543210',
      createdAt: new Date(),
    });

    this.athletes.push({
      _id: 'ath_neeraj_01',
      user: 'usr_neeraj_01',
      athleteId: 'SAI-921840',
      age: 19,
      gender: 'male',
      primarySport: 'Athletics (Javelin)',
      benchmarkRadar: {
        power: 96,
        endurance: 91,
        strength: 95,
        agility: 88,
        flexibility: 85,
        overallScore: 94,
      },
      nationalPercentile: 98.6,
      stateRank: 1,
      createdAt: new Date(),
    });

    this.users.push({
      _id: 'usr_pooja_02',
      name: 'Pooja Patil',
      email: 'pooja@scoutx.com',
      password: '$2a$10$eDummyHashedPasswordForDemoTestingOnly02',
      role: 'athlete',
      state: 'Maharashtra',
      district: 'Kolhapur',
      phone: '9876543211',
      createdAt: new Date(),
    });

    this.athletes.push({
      _id: 'ath_pooja_02',
      user: 'usr_pooja_02',
      athleteId: 'SAI-710293',
      age: 18,
      gender: 'female',
      primarySport: 'Football',
      benchmarkRadar: {
        power: 84,
        endurance: 88,
        strength: 80,
        agility: 92,
        flexibility: 78,
        overallScore: 85,
      },
      nationalPercentile: 89.2,
      stateRank: 4,
      createdAt: new Date(),
    });
  }
}

const store = new EmbeddedStore();
module.exports = store;
