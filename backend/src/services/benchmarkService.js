const https = require('https');

/**
 * ScoutX Football Star Players & Benchmark Dataset Service
 * Integrates with TheSportsDB Free Open API & Wikipedia Open REST API
 * Provides pre-existing benchmark profiles and 1-tap demo drill presets.
 */

// Curated Star Players Database (Indian & Global Icons)
const FAMOUS_PLAYERS_CATALOG = [
  {
    id: 'star_chhetri',
    name: 'Sunil Chhetri',
    searchQuery: 'Sunil Chhetri',
    nationality: 'India 🇮🇳',
    club: 'Bengaluru FC',
    league: 'Indian Super League',
    position: 'Striker',
    preferredFoot: 'Right',
    age: 39,
    heightCm: 170,
    weightKg: 69,
    overallScore: 94.5,
    dribblingScore: 89.0,
    shootingScore: 97.0,
    ballControlScore: 92.5,
    shotAccuracy: 95.0,
    estimatedPower: 91.0,
    nationalPercentile: 99.8,
    photoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500&auto=format&fit=crop&q=80',
    achievements: [
      '3rd Highest Active International Goalscorer in Football History (94 Goals)',
      '7-time AIFF Player of the Year',
      'Khel Ratna & Padma Shri Awardee',
    ],
    demoDrills: {
      shooting: {
        drillType: 'shooting',
        drillTitle: 'Chhetri Precision Top-Corner Finishing Drill',
        durationSec: 8.5,
        ballTouches: 6,
        shotsCount: 5,
        onTargetCount: 5,
        goalsDetected: 4,
        onTargetAccuracy: 96.0,
        estimatedPower: 92.0,
        conversionRate: 80.0,
        overallScore: 96.2,
        feedback: [
          'World-class placement into top-left and top-right postage stamps.',
          'Flawless hip rotation and clean instep strike follow-through.',
        ],
      },
    },
  },
  {
    id: 'star_messi',
    name: 'Lionel Messi',
    searchQuery: 'Lionel Messi',
    nationality: 'Argentina 🇦🇷',
    club: 'Inter Miami CF',
    league: 'Major League Soccer',
    position: 'Winger / Attacking Midfielder',
    preferredFoot: 'Left',
    age: 37,
    heightCm: 170,
    weightKg: 72,
    overallScore: 98.5,
    dribblingScore: 99.0,
    shootingScore: 97.5,
    ballControlScore: 99.0,
    shotAccuracy: 98.0,
    estimatedPower: 89.0,
    nationalPercentile: 99.9,
    photoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80',
    achievements: [
      '8-time Ballon d\'Or Winner',
      '2022 FIFA World Cup Champion & Golden Ball',
      'All-time Top Scorer in La Liga (474 Goals)',
    ],
    demoDrills: {
      dribbling: {
        drillType: 'dribbling',
        drillTitle: 'Messi Low Center of Gravity Slalom Mastery',
        durationSec: 9.8,
        ballTouches: 19,
        controlConsistency: 98.5,
        directionChanges: 8,
        avgProximityRatio: 0.28,
        overallScore: 98.7,
        feedback: [
          'Unrivalled stride proximity: Ball never strayed beyond 30cm from foot.',
          'Sub-second directional cuts (>45 deg) with zero deceleration.',
        ],
      },
    },
  },
  {
    id: 'star_ronaldo',
    name: 'Cristiano Ronaldo',
    searchQuery: 'Cristiano Ronaldo',
    nationality: 'Portugal 🇵🇹',
    club: 'Al Nassr FC',
    league: 'Saudi Pro League',
    position: 'Striker',
    preferredFoot: 'Right',
    age: 39,
    heightCm: 187,
    weightKg: 83,
    overallScore: 97.0,
    dribblingScore: 90.0,
    shootingScore: 99.0,
    ballControlScore: 93.0,
    shotAccuracy: 96.0,
    estimatedPower: 98.5,
    nationalPercentile: 99.9,
    photoUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=500&auto=format&fit=crop&q=80',
    achievements: [
      '5-time Ballon d\'Or Winner',
      'All-Time Official Top Goalscorer in Football History (900+ Goals)',
      '5-time UEFA Champions League Winner',
    ],
    demoDrills: {
      shooting: {
        drillType: 'shooting',
        drillTitle: 'Ronaldo High-Velocity Knuckleball Power Drill',
        durationSec: 10.2,
        ballTouches: 7,
        shotsCount: 6,
        onTargetCount: 5,
        goalsDetected: 5,
        onTargetAccuracy: 94.0,
        estimatedPower: 98.5,
        conversionRate: 83.3,
        overallScore: 97.8,
        feedback: [
          'Maximum strike velocity impulse with dipping trajectory.',
          'Dominant explosive vertical leap and plant foot stability.',
        ],
      },
    },
  },
  {
    id: 'star_chhangte',
    name: 'Lallianzuala Chhangte',
    searchQuery: 'Lallianzuala Chhangte',
    nationality: 'India 🇮🇳',
    club: 'Mumbai City FC',
    league: 'Indian Super League',
    position: 'Winger',
    preferredFoot: 'Left',
    age: 26,
    heightCm: 172,
    weightKg: 66,
    overallScore: 91.5,
    dribblingScore: 95.0,
    shootingScore: 88.0,
    ballControlScore: 91.0,
    shotAccuracy: 89.0,
    estimatedPower: 86.0,
    nationalPercentile: 98.2,
    photoUrl: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=500&auto=format&fit=crop&q=80',
    achievements: [
      'AIFF Men\'s Player of the Year 2023 & 2024',
      'ISL Golden Ball Winner',
      'Known as the "Mizo Flash" for blistering pace',
    ],
    demoDrills: {
      dribbling: {
        drillType: 'dribbling',
        drillTitle: 'Chhangte High-Speed Wing Slalom Agility',
        durationSec: 10.5,
        ballTouches: 16,
        controlConsistency: 94.0,
        directionChanges: 7,
        avgProximityRatio: 0.35,
        overallScore: 94.8,
        feedback: [
          'Elite sprint acceleration while maintaining rapid left-foot touch cadence.',
          'Explosive cone separation speed.',
        ],
      },
    },
  },
  {
    id: 'star_sahal',
    name: 'Sahal Abdul Samad',
    searchQuery: 'Sahal Abdul Samad',
    nationality: 'India 🇮🇳',
    club: 'Mohun Bagan Super Giant',
    league: 'Indian Super League',
    position: 'Attacking Midfielder',
    preferredFoot: 'Right',
    age: 27,
    heightCm: 177,
    weightKg: 70,
    overallScore: 90.0,
    dribblingScore: 93.5,
    shootingScore: 85.0,
    ballControlScore: 94.0,
    shotAccuracy: 86.0,
    estimatedPower: 82.0,
    nationalPercentile: 97.5,
    photoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=80',
    achievements: [
      'ISL Emerging Player of the Year',
      'Key playmaker for Indian National Team',
      'Renowned for tight-space turning and dribbling',
    ],
    demoDrills: {
      ball_control: {
        drillType: 'ball_control',
        drillTitle: 'Sahal 360 First-Touch Cushion & Juggling Drill',
        durationSec: 14.0,
        touchesCount: 38,
        leftPercentage: 45.0,
        rightPercentage: 55.0,
        reboundControlScore: 95.0,
        controlConsistency: 93.0,
        overallScore: 93.8,
        feedback: [
          'Soft instep cushioning absorbing 95% of incoming ball momentum.',
          'Bilateral foot equilibrium: 45% Left / 55% Right.',
        ],
      },
    },
  },
  {
    id: 'star_mbappe',
    name: 'Kylian Mbappé',
    searchQuery: 'Kylian Mbappe',
    nationality: 'France 🇫🇷',
    club: 'Real Madrid CF',
    league: 'La Liga',
    position: 'Forward / Winger',
    preferredFoot: 'Right',
    age: 25,
    heightCm: 178,
    weightKg: 75,
    overallScore: 97.5,
    dribblingScore: 98.0,
    shootingScore: 96.5,
    ballControlScore: 95.0,
    shotAccuracy: 95.0,
    estimatedPower: 94.0,
    nationalPercentile: 99.9,
    photoUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500&auto=format&fit=crop&q=80',
    achievements: [
      '2018 FIFA World Cup Champion & 2022 Golden Boot (8 Goals)',
      '6-time Ligue 1 Top Scorer',
      'Real Madrid Galáctico Striker',
    ],
    demoDrills: {
      shooting: {
        drillType: 'shooting',
        drillTitle: 'Mbappé Sprint-Breakaway Far-Corner Curl',
        durationSec: 8.9,
        ballTouches: 8,
        shotsCount: 4,
        onTargetCount: 4,
        goalsDetected: 4,
        onTargetAccuracy: 98.0,
        estimatedPower: 95.0,
        conversionRate: 100.0,
        overallScore: 98.2,
        feedback: [
          'Flawless body shape opening for far-post curling strikes.',
          'Top tier release speed inside 0.4 seconds of first touch.',
        ],
      },
    },
  },
  {
    id: 'star_debruyne',
    name: 'Kevin De Bruyne',
    searchQuery: 'Kevin De Bruyne',
    nationality: 'Belgium 🇧🇪',
    club: 'Manchester City FC',
    league: 'Premier League',
    position: 'Central Midfielder',
    preferredFoot: 'Right',
    age: 33,
    heightCm: 181,
    weightKg: 75,
    overallScore: 96.5,
    dribblingScore: 89.0,
    shootingScore: 94.0,
    ballControlScore: 99.0,
    shotAccuracy: 96.0,
    estimatedPower: 95.0,
    nationalPercentile: 99.9,
    photoUrl: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=80',
    achievements: [
      '2-time PFA Players\' Player of the Year',
      'UEFA Champions League Winner with Manchester City',
      'Premier League Playmaker of the Season (Multiple Years)',
    ],
    demoDrills: {
      ball_control: {
        drillType: 'ball_control',
        drillTitle: 'De Bruyne Cross-Field First Touch Masterclass',
        durationSec: 15.0,
        touchesCount: 42,
        leftPercentage: 48.0,
        rightPercentage: 52.0,
        reboundControlScore: 98.5,
        controlConsistency: 97.0,
        overallScore: 97.5,
        feedback: [
          'Near-zero rebound displacement on heavy cross-field aerial drops.',
          'Masterclass bilateral two-footed weight distribution (48% Left / 52% Right).',
        ],
      },
    },
  },
  {
    id: 'star_gurpreet',
    name: 'Gurpreet Singh Sandhu',
    searchQuery: 'Gurpreet Singh Sandhu',
    nationality: 'India 🇮🇳',
    club: 'Bengaluru FC',
    league: 'Indian Super League',
    position: 'Goalkeeper',
    preferredFoot: 'Right',
    age: 32,
    heightCm: 198,
    weightKg: 90,
    overallScore: 91.0,
    dribblingScore: 72.0,
    shootingScore: 70.0,
    ballControlScore: 96.0,
    shotAccuracy: 75.0,
    estimatedPower: 92.0,
    nationalPercentile: 98.5,
    photoUrl: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=500&auto=format&fit=crop&q=80',
    achievements: [
      'First Indian to play in UEFA Europa League (Stabæk FC)',
      'Arjuna Awardee 2019',
      '3-time ISL Golden Glove Winner',
    ],
    demoDrills: {
      ball_control: {
        drillType: 'ball_control',
        drillTitle: 'Gurpreet Reflex Handling & Aerial Grip Drill',
        durationSec: 12.0,
        touchesCount: 26,
        leftPercentage: 50.0,
        rightPercentage: 50.0,
        reboundControlScore: 96.0,
        controlConsistency: 95.0,
        overallScore: 95.2,
        feedback: [
          'Immediate kinetic absorption on high-velocity strikes.',
          'Dominant 198cm aerial wingspan reach.',
        ],
      },
    },
  },
];

/**
 * Fetches player metadata from TheSportsDB free API with timeout protection
 */
function fetchFromSportsDB(playerName) {
  return new Promise((resolve) => {
    const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(playerName)}`;
    const req = https.get(url, { timeout: 3500 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.player && parsed.player.length > 0) {
            const p = parsed.player[0];
            resolve({
              apiId: p.idPlayer,
              strPlayer: p.strPlayer,
              strTeam: p.strTeam,
              strNationality: p.strNationality,
              strPosition: p.strPosition,
              strThumb: p.strThumb,
              strCutout: p.strCutout,
              strDescriptionEN: p.strDescriptionEN,
              dateBorn: p.dateBorn,
            });
            return;
          }
        } catch (e) {}
        resolve(null);
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

/**
 * Get all famous benchmark players with augmented API data
 */
async function getFamousBenchmarks() {
  const enhancedList = await Promise.all(
    FAMOUS_PLAYERS_CATALOG.map(async (player) => {
      let liveApiData = null;
      try {
        liveApiData = await fetchFromSportsDB(player.searchQuery);
      } catch (e) {}

      return {
        ...player,
        apiSource: liveApiData ? 'TheSportsDB Open API ⚽' : 'ScoutX Verified Pro Dataset 🛡️',
        photoUrl: (liveApiData && liveApiData.strThumb) || player.photoUrl,
        club: (liveApiData && liveApiData.strTeam) || player.club,
        isVerifiedBenchmark: true,
      };
    })
  );

  return enhancedList;
}

/**
 * Get individual benchmark by ID
 */
function getBenchmarkById(id) {
  return FAMOUS_PLAYERS_CATALOG.find((p) => p.id === id || p.searchQuery.toLowerCase() === id.toLowerCase()) || null;
}

/**
 * Generate 1-tap demo assessment based on a famous player drill
 */
function createDemoAssessment(starId, drillType = 'shooting') {
  const player = getBenchmarkById(starId) || FAMOUS_PLAYERS_CATALOG[0];
  const drillPreset =
    (player.demoDrills && player.demoDrills[drillType]) ||
    Object.values(player.demoDrills || {})[0] ||
    {
      drillType,
      drillTitle: `${player.name} Benchmark ${drillType.toUpperCase()} Drill`,
      durationSec: 11.2,
      ballTouches: 15,
      controlConsistency: 92.0,
      directionChanges: 6,
      overallScore: player.overallScore,
      feedback: [`Outstanding technical benchmark execution matching ${player.name}'s standards.`],
    };

  const isDribble = drillType === 'dribbling';
  const isShot = drillType === 'shooting';
  const isControl = drillType === 'ball_control';

  const metrics = {
    durationSec: drillPreset.durationSec || 10.5,
    ballTouches: drillPreset.ballTouches || drillPreset.touchesCount || 16,
    touchesCount: drillPreset.touchesCount || drillPreset.ballTouches || 16,
    controlConsistency: drillPreset.controlConsistency || 92.0,
    directionChanges: drillPreset.directionChanges || (isDribble ? 6 : 2),
    onTargetAccuracy: drillPreset.onTargetAccuracy || (isShot ? 94.0 : 80.0),
    estimatedPower: drillPreset.estimatedPower || (isShot ? 91.0 : 82.0),
    reboundControlScore: drillPreset.reboundControlScore || (isControl ? 95.0 : 88.0),
    leftFootPercentage: drillPreset.leftPercentage || (player.preferredFoot === 'Left' ? 70.0 : 35.0),
    rightFootPercentage: drillPreset.rightPercentage || (player.preferredFoot === 'Right' ? 65.0 : 30.0),
    observedFootUsage: player.preferredFoot === 'Left' ? 'Left-Dominant' : 'Right-Dominant',
    declaredPreferredFoot: player.preferredFoot,
  };

  const rawMetrics = {
    durationSec: metrics.durationSec,
    ballTouches: metrics.ballTouches,
    leftFootTouches: Math.round(metrics.ballTouches * (metrics.leftFootPercentage / 100)),
    rightFootTouches: Math.round(metrics.ballTouches * (metrics.rightFootPercentage / 100)),
    directionChanges: metrics.directionChanges,
    onTargetCount: drillPreset.onTargetCount || 5,
    attemptsCount: drillPreset.shotsCount || 5,
    goalsDetected: drillPreset.goalsDetected || 4,
    onTargetAccuracyPercentage: metrics.onTargetAccuracy,
    estimatedPowerIndex: metrics.estimatedPower,
    reboundControlPercentage: metrics.reboundControlScore,
    controlConsistencyPercentage: metrics.controlConsistency,
  };

  return {
    success: true,
    isDemoBenchmark: true,
    benchmarkPlayer: {
      name: player.name,
      nationality: player.nationality,
      club: player.club,
      position: player.position,
      preferredFoot: player.preferredFoot,
      photoUrl: player.photoUrl,
    },
    drillType,
    drillTitle: drillPreset.drillTitle,
    overallScore: drillPreset.overallScore || player.overallScore,
    score: drillPreset.overallScore || player.overallScore,
    rawMetrics,
    metrics,
    videoQuality: {
      resolution: '1920x1080 (HD Pro Broadcast)',
      fps: 60.0,
      durationSec: metrics.durationSec,
      qualityScore: 98.5,
      ballVisibilityPercentage: 99.0,
      playerVisibilityPercentage: 100.0,
      warnings: [],
      is_acceptable: true,
    },
    detections: {
      ball: {
        framesDetected: Math.round(metrics.durationSec * 30),
        totalFrames: Math.round(metrics.durationSec * 30),
        visibilityPercentage: 99.0,
        averageConfidence: 0.98,
      },
      player: {
        framesDetected: Math.round(metrics.durationSec * 30),
        totalFrames: Math.round(metrics.durationSec * 30),
        visibilityPercentage: 100.0,
        averageConfidence: 0.99,
      },
      goal: {
        detected: isShot,
        confidence: isShot ? 0.96 : 0.0,
        status: isShot ? 'Goal structure detected (FIFA Regulation Post)' : 'Goal structure unavailable',
      },
    },
    footUsage: {
      leftPercentage: metrics.leftFootPercentage,
      rightPercentage: metrics.rightFootPercentage,
      observedFootUsage: metrics.observedFootUsage,
      declaredPreferredFoot: metrics.declaredPreferredFoot,
    },
    feedback: [
      `⭐ ${player.name} Benchmark Calibration Applied!`,
      ...(drillPreset.feedback || []),
    ],
    warnings: [],
    analysisConfidence: 0.98,
    aiConfidenceScore: 0.98,
    processingTimeSec: 0.8,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  FAMOUS_PLAYERS_CATALOG,
  getFamousBenchmarks,
  getBenchmarkById,
  createDemoAssessment,
};
