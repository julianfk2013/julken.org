const CONFIG = {
  // Phone dimensions (portrait)
  WIDTH: 600,
  HEIGHT: 1000,

  // Tablet dimensions (landscape) - fills iPad screen better
  TABLET_WIDTH: 1200,
  TABLET_HEIGHT: 800,

  PLAYER_WIDTH: 64,
  PLAYER_HEIGHT: 64,
  PLAYER_SPEED: 350,
  PLAYER_FIRE_RATE: 150,
  PLAYER_MAX_HP: 100,
  PLAYER_START_SHIELDS: 0,
  PLAYER_RESPAWN_INVULNERABILITY: 3000,

  BULLET_WIDTH: 8,
  BULLET_HEIGHT: 20,
  BULLET_SPEED: 700,
  BULLET_DAMAGE: 15,

  SPREAD_ANGLE: 0.3,
  SPREAD_BULLETS: 3,

  LASER_WIDTH: 12,
  LASER_HEIGHT: 40,
  LASER_DAMAGE: 8,
  LASER_DURATION: 100,

  MISSILE_WIDTH: 16,
  MISSILE_HEIGHT: 32,
  MISSILE_SPEED: 500,
  MISSILE_DAMAGE: 40,
  MISSILE_TURN_SPEED: 4,

  ENEMY_SPAWN_INTERVAL: 1500,
  ENEMY_BULLET_SPEED: 350,
  ENEMY_BULLET_DAMAGE: 10,
  ENEMY_BASE_SCORE: 100,

  WAVE_CLEAR_DELAY: 3000,
  BOSS_EVERY_N_WAVES: 5,
  ENEMIES_PER_WAVE_BASE: 8,
  ENEMIES_PER_WAVE_INCREMENT: 3,

  POWERUP_DROP_CHANCE: 0.25,
  POWERUP_FALL_SPEED: 120,
  POWERUP_LIFETIME: 8000,

  GRAVITY: 0,
  PARTICLE_LIFETIME: 1200,
  SCREEN_SHAKE_DECAY: 0.9,

  STAR_LAYERS: 3,
  STAR_SPEED_BASE: 30,
  STAR_COUNT_PER_LAYER: 60,

  FORMATION_SPAWN_DELAY: 300,

  DIFFICULTY_SCALE_RATE: 0.15,
  MAX_DIFFICULTY_MULTIPLIER: 3.0,
};

const ENEMY_TYPES = {
  SCOUT: 0,
  FIGHTER: 1,
  INTERCEPTOR: 2,

  HEAVY: 3,
  BOMBER: 4,
  GUNSHIP: 5,

  ELITE: 6,
  KAMIKAZE: 7,
  SPLITTER: 8,

  SHIELDED: 9,
  DODGER: 10,
  SPAWNER: 11,
  TELEPORTER: 12,
  ARMORED: 13,
  BOSS_MINION: 14,
};

const ENEMY_PROPS = {
  [ENEMY_TYPES.SCOUT]: {
    hp: 20,
    score: 50,
    speed: 180,
    shootChance: 0.015,
    shootPattern: 'single',
    movePattern: 'straight',
    color: '#94a3b8',
    width: 48,
    height: 48,
    name: 'Scout',
    points: [0, -24, -20, 24, 20, 24],
  },

  [ENEMY_TYPES.FIGHTER]: {
    hp: 35,
    score: 100,
    speed: 140,
    shootChance: 0.025,
    shootPattern: 'single',
    movePattern: 'sine',
    color: '#3b82f6',
    width: 52,
    height: 52,
    name: 'Fighter',
    points: [0, -26, -22, 20, 0, 26, 22, 20],
  },

  [ENEMY_TYPES.INTERCEPTOR]: {
    hp: 25,
    score: 120,
    speed: 220,
    shootChance: 0.02,
    shootPattern: 'single',
    movePattern: 'zigzag',
    color: '#06b6d4',
    width: 50,
    height: 50,
    name: 'Interceptor',
    points: [0, -25, -18, 16, -8, 25, 8, 25, 18, 16],
  },

  [ENEMY_TYPES.HEAVY]: {
    hp: 60,
    score: 200,
    speed: 80,
    shootChance: 0.03,
    shootPattern: 'double',
    movePattern: 'straight',
    color: '#8b5cf6',
    width: 64,
    height: 64,
    name: 'Heavy',
    points: [0, -32, -28, 20, -20, 32, 20, 32, 28, 20],
  },

  [ENEMY_TYPES.BOMBER]: {
    hp: 45,
    score: 180,
    speed: 100,
    shootChance: 0.04,
    shootPattern: 'spread3',
    movePattern: 'straight',
    color: '#f97316',
    width: 58,
    height: 58,
    name: 'Bomber',
    points: [0, -29, -26, 12, -18, 29, 18, 29, 26, 12],
  },

  [ENEMY_TYPES.GUNSHIP]: {
    hp: 50,
    score: 220,
    speed: 110,
    shootChance: 0.05,
    shootPattern: 'rapid',
    movePattern: 'sine',
    color: '#14b8a6',
    width: 56,
    height: 56,
    name: 'Gunship',
    points: [0, -28, -24, 18, -12, 28, 12, 28, 24, 18],
  },

  [ENEMY_TYPES.ELITE]: {
    hp: 80,
    score: 300,
    speed: 120,
    shootChance: 0.04,
    shootPattern: 'aimed',
    movePattern: 'circle',
    color: '#6b21a8',
    width: 60,
    height: 60,
    name: 'Elite',
    points: [0, -30, -26, 15, -16, 30, 0, 20, 16, 30, 26, 15],
  },

  [ENEMY_TYPES.KAMIKAZE]: {
    hp: 15,
    score: 150,
    speed: 280,
    shootChance: 0,
    shootPattern: 'none',
    movePattern: 'dive',
    color: '#ef4444',
    width: 44,
    height: 44,
    name: 'Kamikaze',
    points: [0, -22, -18, 16, -10, 22, 10, 22, 18, 16],
  },

  [ENEMY_TYPES.SPLITTER]: {
    hp: 30,
    score: 180,
    speed: 130,
    shootChance: 0.01,
    shootPattern: 'single',
    movePattern: 'zigzag',
    color: '#eab308',
    width: 48,
    height: 48,
    name: 'Splitter',
    points: [0, -24, -20, 10, -12, 24, 12, 24, 20, 10],
  },

  [ENEMY_TYPES.SHIELDED]: {
    hp: 40,
    score: 250,
    speed: 90,
    shootChance: 0.025,
    shootPattern: 'double',
    movePattern: 'straight',
    color: '#22c55e',
    shield: 40,
    width: 62,
    height: 62,
    name: 'Shielded',
    points: [0, -31, -28, 18, -18, 31, 18, 31, 28, 18],
  },

  [ENEMY_TYPES.DODGER]: {
    hp: 35,
    score: 280,
    speed: 200,
    shootChance: 0.015,
    shootPattern: 'single',
    movePattern: 'dodge',
    color: '#06b6d4',
    width: 50,
    height: 50,
    name: 'Dodger',
    points: [0, -25, -20, 12, -14, 25, 14, 25, 20, 12],
  },

  [ENEMY_TYPES.SPAWNER]: {
    hp: 50,
    score: 320,
    speed: 70,
    shootChance: 0.01,
    shootPattern: 'single',
    movePattern: 'hover',
    color: '#ec4899',
    spawns: true,
    spawnType: ENEMY_TYPES.SCOUT,
    spawnInterval: 4000,
    width: 64,
    height: 64,
    name: 'Spawner',
    points: [0, -32, -28, 0, -20, 32, 20, 32, 28, 0],
  },

  [ENEMY_TYPES.TELEPORTER]: {
    hp: 40,
    score: 350,
    speed: 100,
    shootChance: 0.02,
    shootPattern: 'spread3',
    movePattern: 'teleport',
    color: '#a855f7',
    width: 54,
    height: 54,
    name: 'Teleporter',
    points: [0, -27, -24, 14, -16, 27, 16, 27, 24, 14],
  },

  [ENEMY_TYPES.ARMORED]: {
    hp: 150,
    score: 400,
    speed: 60,
    shootChance: 0.02,
    shootPattern: 'double',
    movePattern: 'straight',
    color: '#1e293b',
    armor: 10,
    width: 72,
    height: 72,
    name: 'Armored',
    points: [0, -36, -32, 20, -24, 36, 24, 36, 32, 20],
  },

  [ENEMY_TYPES.BOSS_MINION]: {
    hp: 25,
    score: 80,
    speed: 150,
    shootChance: 0.03,
    shootPattern: 'single',
    movePattern: 'protect',
    color: '#f59e0b',
    width: 46,
    height: 46,
    name: 'Minion',
    points: [0, -23, -19, 18, -12, 23, 12, 23, 19, 18],
  },
};

const POWERUP_TYPES = {
  SPREAD_SHOT: 0,
  RAPID_FIRE: 1,
  LASER_BEAM: 2,
  HOMING_MISSILES: 3,
  PIERCE_SHOT: 4,
  TRIPLE_SHOT: 5,
  WAVE_BEAM: 6,

  SMART_BOMB: 7,
  NUKE: 8,
  LIGHTNING_STORM: 9,
  TIME_SLOW: 10,
  SHIELD_RESTORE: 11,
  HEALTH_PACK: 12,

  FORCE_FIELD: 13,
  PHASE_SHIELD: 14,
  MAGNET: 15,
  INVINCIBILITY: 16,

  SCORE_MULTIPLIER: 17,
  COIN_RAIN: 18,
  EXTRA_LIFE: 19,
};

const POWERUP_PROPS = {
  [POWERUP_TYPES.SPREAD_SHOT]: {
    name: 'Spread Shot',
    duration: 12000,
    icon: '⚡',
    color: '#38bdf8',
    description: '3-way spread fire'
  },

  [POWERUP_TYPES.RAPID_FIRE]: {
    name: 'Rapid Fire',
    duration: 10000,
    icon: '⚡⚡',
    color: '#f97316',
    description: '3x fire rate'
  },

  [POWERUP_TYPES.LASER_BEAM]: {
    name: 'Laser Beam',
    duration: 8000,
    icon: '━',
    color: '#22c55e',
    description: 'Continuous laser'
  },

  [POWERUP_TYPES.HOMING_MISSILES]: {
    name: 'Homing Missiles',
    duration: 15000,
    icon: '🎯',
    color: '#ef4444',
    description: 'Seeking missiles'
  },

  [POWERUP_TYPES.PIERCE_SHOT]: {
    name: 'Pierce Shot',
    duration: 12000,
    icon: '➤',
    color: '#a855f7',
    description: 'Bullets pierce enemies'
  },

  [POWERUP_TYPES.TRIPLE_SHOT]: {
    name: 'Triple Shot',
    duration: 14000,
    icon: '|||',
    color: '#06b6d4',
    description: 'Fire 3 bullets'
  },

  [POWERUP_TYPES.WAVE_BEAM]: {
    name: 'Wave Beam',
    duration: 10000,
    icon: '〰',
    color: '#8b5cf6',
    description: 'Sine wave bullets'
  },

  [POWERUP_TYPES.SMART_BOMB]: {
    name: 'Smart Bomb',
    duration: 0,
    icon: '💣',
    color: '#ef4444',
    description: 'Clear all enemies'
  },

  [POWERUP_TYPES.NUKE]: {
    name: 'Nuke',
    duration: 0,
    icon: '☢',
    color: '#dc2626',
    description: 'Massive explosion'
  },

  [POWERUP_TYPES.LIGHTNING_STORM]: {
    name: 'Lightning Storm',
    duration: 0,
    icon: '⚡',
    color: '#eab308',
    description: 'Chain lightning'
  },

  [POWERUP_TYPES.TIME_SLOW]: {
    name: 'Time Slow',
    duration: 6000,
    icon: '🐌',
    color: '#14b8a6',
    description: 'Slow down time'
  },

  [POWERUP_TYPES.SHIELD_RESTORE]: {
    name: 'Shield Restore',
    duration: 0,
    icon: '🛡',
    color: '#3b82f6',
    description: '+50 shields'
  },

  [POWERUP_TYPES.HEALTH_PACK]: {
    name: 'Health Pack',
    duration: 0,
    icon: '❤',
    color: '#ef4444',
    description: '+30 HP'
  },

  [POWERUP_TYPES.FORCE_FIELD]: {
    name: 'Force Field',
    duration: 12000,
    icon: '⭕',
    color: '#06b6d4',
    description: 'Absorb hits'
  },

  [POWERUP_TYPES.PHASE_SHIELD]: {
    name: 'Phase Shield',
    duration: 8000,
    icon: '👻',
    color: '#94a3b8',
    description: 'Pass through enemies'
  },

  [POWERUP_TYPES.MAGNET]: {
    name: 'Magnet',
    duration: 20000,
    icon: '🧲',
    color: '#ec4899',
    description: 'Auto-collect items'
  },

  [POWERUP_TYPES.INVINCIBILITY]: {
    name: 'Invincibility',
    duration: 5000,
    icon: '⭐',
    color: '#f59e0b',
    description: 'Cannot be damaged'
  },

  [POWERUP_TYPES.SCORE_MULTIPLIER]: {
    name: 'Score 3x',
    duration: 15000,
    icon: '💰',
    color: '#eab308',
    description: 'Triple score'
  },

  [POWERUP_TYPES.COIN_RAIN]: {
    name: 'Coin Rain',
    duration: 0,
    icon: '💸',
    color: '#fbbf24',
    description: 'Bonus coins'
  },

  [POWERUP_TYPES.EXTRA_LIFE]: {
    name: 'Extra Life',
    duration: 0,
    icon: '💚',
    color: '#22c55e',
    description: '+1 Max HP permanently'
  },
};

const FORMATIONS = {
  V_FORMATION: 'v_formation',
  LINE: 'line',
  DOUBLE_LINE: 'double_line',
  CIRCLE: 'circle',
  DIAMOND: 'diamond',
  WAVE: 'wave',
  PINCER: 'pincer',
  SWARM: 'swarm',
  WALL: 'wall',
  SPIRAL: 'spiral',
};

// Portrait-optimized formations - enemies spawn in tight rows
const FORMATION_PATTERNS = {
  [FORMATIONS.V_FORMATION]: {
    positions: [
      { x: 0.5, y: 0.08 },
      { x: 0.35, y: 0.12 },
      { x: 0.65, y: 0.12 },
      { x: 0.2, y: 0.16 },
      { x: 0.8, y: 0.16 },
    ],
    delay: 200,
  },

  [FORMATIONS.LINE]: {
    positions: [
      { x: 0.2, y: 0.08 },
      { x: 0.4, y: 0.08 },
      { x: 0.6, y: 0.08 },
      { x: 0.8, y: 0.08 },
    ],
    delay: 150,
  },

  [FORMATIONS.DOUBLE_LINE]: {
    positions: [
      { x: 0.25, y: 0.06 },
      { x: 0.5, y: 0.06 },
      { x: 0.75, y: 0.06 },
      { x: 0.15, y: 0.12 },
      { x: 0.4, y: 0.12 },
      { x: 0.6, y: 0.12 },
      { x: 0.85, y: 0.12 },
    ],
    delay: 150,
  },

  [FORMATIONS.CIRCLE]: {
    positions: [
      { x: 0.5, y: 0.06 },
      { x: 0.75, y: 0.1 },
      { x: 0.25, y: 0.1 },
      { x: 0.5, y: 0.14 },
    ],
    delay: 180,
  },

  [FORMATIONS.DIAMOND]: {
    positions: [
      { x: 0.5, y: 0.06 },
      { x: 0.3, y: 0.1 },
      { x: 0.7, y: 0.1 },
      { x: 0.5, y: 0.14 },
    ],
    delay: 160,
  },

  [FORMATIONS.PINCER]: {
    positions: [
      { x: 0.15, y: 0.08 },
      { x: 0.15, y: 0.14 },
      { x: 0.85, y: 0.08 },
      { x: 0.85, y: 0.14 },
    ],
    delay: 200,
  },

  [FORMATIONS.SWARM]: {
    positions: [
      { x: 0.25, y: 0.06 },
      { x: 0.5, y: 0.06 },
      { x: 0.75, y: 0.06 },
      { x: 0.15, y: 0.11 },
      { x: 0.4, y: 0.11 },
      { x: 0.6, y: 0.11 },
      { x: 0.85, y: 0.11 },
      { x: 0.3, y: 0.16 },
      { x: 0.5, y: 0.16 },
      { x: 0.7, y: 0.16 },
    ],
    delay: 120,
  },

  [FORMATIONS.WALL]: {
    positions: [
      { x: 0.2, y: 0.06 },
      { x: 0.4, y: 0.06 },
      { x: 0.6, y: 0.06 },
      { x: 0.8, y: 0.06 },
      { x: 0.15, y: 0.12 },
      { x: 0.35, y: 0.12 },
      { x: 0.5, y: 0.12 },
      { x: 0.65, y: 0.12 },
      { x: 0.85, y: 0.12 },
    ],
    delay: 100,
  },

  [FORMATIONS.WAVE]: {
    positions: [
      { x: 0.2, y: 0.08 },
      { x: 0.4, y: 0.06 },
      { x: 0.6, y: 0.08 },
      { x: 0.8, y: 0.06 },
    ],
    delay: 180,
  },

  [FORMATIONS.SPIRAL]: {
    positions: [
      { x: 0.5, y: 0.05 },
      { x: 0.7, y: 0.08 },
      { x: 0.3, y: 0.08 },
      { x: 0.6, y: 0.12 },
      { x: 0.4, y: 0.12 },
    ],
    delay: 200,
  },
};

// Tablet-optimized formations - enemies spread out horizontally for landscape
const TABLET_FORMATION_PATTERNS = {
  [FORMATIONS.V_FORMATION]: {
    positions: [
      { x: 0.5, y: 0.1 },
      { x: 0.3, y: 0.18 },
      { x: 0.7, y: 0.18 },
      { x: 0.1, y: 0.26 },
      { x: 0.9, y: 0.26 },
    ],
    delay: 200,
  },

  [FORMATIONS.LINE]: {
    positions: [
      { x: 0.1, y: 0.12 },
      { x: 0.3, y: 0.12 },
      { x: 0.5, y: 0.12 },
      { x: 0.7, y: 0.12 },
      { x: 0.9, y: 0.12 },
    ],
    delay: 150,
  },

  [FORMATIONS.DOUBLE_LINE]: {
    positions: [
      { x: 0.15, y: 0.1 },
      { x: 0.35, y: 0.1 },
      { x: 0.5, y: 0.1 },
      { x: 0.65, y: 0.1 },
      { x: 0.85, y: 0.1 },
      { x: 0.1, y: 0.2 },
      { x: 0.3, y: 0.2 },
      { x: 0.5, y: 0.2 },
      { x: 0.7, y: 0.2 },
      { x: 0.9, y: 0.2 },
    ],
    delay: 150,
  },

  [FORMATIONS.CIRCLE]: {
    positions: [
      { x: 0.5, y: 0.08 },
      { x: 0.8, y: 0.15 },
      { x: 0.2, y: 0.15 },
      { x: 0.65, y: 0.25 },
      { x: 0.35, y: 0.25 },
      { x: 0.5, y: 0.3 },
    ],
    delay: 180,
  },

  [FORMATIONS.DIAMOND]: {
    positions: [
      { x: 0.5, y: 0.08 },
      { x: 0.25, y: 0.18 },
      { x: 0.75, y: 0.18 },
      { x: 0.5, y: 0.28 },
    ],
    delay: 160,
  },

  [FORMATIONS.PINCER]: {
    positions: [
      { x: 0.05, y: 0.1 },
      { x: 0.15, y: 0.18 },
      { x: 0.05, y: 0.26 },
      { x: 0.95, y: 0.1 },
      { x: 0.85, y: 0.18 },
      { x: 0.95, y: 0.26 },
    ],
    delay: 200,
  },

  [FORMATIONS.SWARM]: {
    positions: [
      { x: 0.15, y: 0.08 },
      { x: 0.35, y: 0.08 },
      { x: 0.5, y: 0.08 },
      { x: 0.65, y: 0.08 },
      { x: 0.85, y: 0.08 },
      { x: 0.1, y: 0.16 },
      { x: 0.3, y: 0.16 },
      { x: 0.5, y: 0.16 },
      { x: 0.7, y: 0.16 },
      { x: 0.9, y: 0.16 },
      { x: 0.2, y: 0.24 },
      { x: 0.4, y: 0.24 },
      { x: 0.6, y: 0.24 },
      { x: 0.8, y: 0.24 },
    ],
    delay: 120,
  },

  [FORMATIONS.WALL]: {
    positions: [
      { x: 0.1, y: 0.08 },
      { x: 0.25, y: 0.08 },
      { x: 0.4, y: 0.08 },
      { x: 0.55, y: 0.08 },
      { x: 0.7, y: 0.08 },
      { x: 0.85, y: 0.08 },
      { x: 0.05, y: 0.16 },
      { x: 0.2, y: 0.16 },
      { x: 0.35, y: 0.16 },
      { x: 0.5, y: 0.16 },
      { x: 0.65, y: 0.16 },
      { x: 0.8, y: 0.16 },
      { x: 0.95, y: 0.16 },
    ],
    delay: 100,
  },

  [FORMATIONS.WAVE]: {
    positions: [
      { x: 0.1, y: 0.12 },
      { x: 0.3, y: 0.08 },
      { x: 0.5, y: 0.12 },
      { x: 0.7, y: 0.08 },
      { x: 0.9, y: 0.12 },
    ],
    delay: 180,
  },

  [FORMATIONS.SPIRAL]: {
    positions: [
      { x: 0.5, y: 0.06 },
      { x: 0.75, y: 0.12 },
      { x: 0.25, y: 0.12 },
      { x: 0.65, y: 0.2 },
      { x: 0.35, y: 0.2 },
      { x: 0.5, y: 0.26 },
    ],
    delay: 200,
  },
};

const BOSS_CONFIGS = {
  1: {
    name: 'Sentinel Prime',
    hp: 1000,
    speed: 100,
    attackInterval: 1800,
    projectileSpeed: 280,
    pattern: 'spread5',
    color: '#64748b',
    width: 180,
    height: 100,
    scoreReward: 5000,
    description: 'First guardian of the fleet',
  },

  2: {
    name: 'Ravager Titan',
    hp: 2000,
    speed: 140,
    attackInterval: 1200,
    projectileSpeed: 320,
    pattern: 'rapidspiral',
    color: '#ef4444',
    width: 200,
    height: 120,
    scoreReward: 8000,
    description: 'Destroyer of worlds',
  },

  3: {
    name: 'Void Leviathan',
    hp: 3500,
    speed: 80,
    attackInterval: 2000,
    projectileSpeed: 300,
    pattern: 'missiles',
    color: '#8b5cf6',
    width: 240,
    height: 140,
    scoreReward: 12000,
    description: 'Ancient war machine',
  },

  4: {
    name: 'Swarm Mother',
    hp: 5000,
    speed: 120,
    attackInterval: 800,
    projectileSpeed: 250,
    pattern: 'drones',
    color: '#06b6d4',
    width: 220,
    height: 130,
    scoreReward: 15000,
    description: 'Spawns endless minions',
    spawnsMinions: true,
  },

  5: {
    name: 'Omega Dreadnought',
    hp: 8000,
    speed: 60,
    attackInterval: 1000,
    projectileSpeed: 340,
    pattern: 'all',
    color: '#f59e0b',
    width: 280,
    height: 160,
    scoreReward: 25000,
    description: 'Final destroyer - uses all attack patterns',
    phases: 3,
  },
};

const SHOP_UPGRADES = {
  BIGGER_SHIP_1: { name: 'Reinforced Hull I', cost: 150, desc: 'Ship +15% larger, +15 max HP', hpBonus: 15, sizeBonus: 0.15 },
  BIGGER_SHIP_2: { name: 'Reinforced Hull II', cost: 300, desc: 'Ship +30% larger, +30 max HP', hpBonus: 30, sizeBonus: 0.30, requires: ['BIGGER_SHIP_1'] },
  BIGGER_SHIP_3: { name: 'Reinforced Hull III', cost: 600, desc: 'Ship +45% larger, +45 max HP', hpBonus: 45, sizeBonus: 0.45, requires: ['BIGGER_SHIP_2'] },

  EXTRA_HP_1: { name: 'Armor Plating I', cost: 200, desc: 'Start with +25 HP', hpBonus: 25 },
  EXTRA_HP_2: { name: 'Armor Plating II', cost: 450, desc: 'Start with +50 HP', hpBonus: 50, requires: ['EXTRA_HP_1'] },
  EXTRA_HP_3: { name: 'Armor Plating III', cost: 900, desc: 'Start with +75 HP', hpBonus: 75, requires: ['EXTRA_HP_2'] },

  FIRE_RATE: { name: 'Rapid Fire Systems', cost: 250, desc: 'Fire 40% faster', fireRateBonus: 0.4 },
  FIRE_RATE_2: { name: 'Advanced Fire Systems', cost: 500, desc: 'Fire 70% faster', fireRateBonus: 0.7, requires: ['FIRE_RATE'] },

  BULLET_DAMAGE: { name: 'Weapon Upgrade', cost: 300, desc: '+50% bullet damage', damageBonus: 0.5 },
  BULLET_DAMAGE_2: { name: 'Advanced Weapons', cost: 600, desc: '+100% bullet damage', damageBonus: 1.0, requires: ['BULLET_DAMAGE'] },

  STARTING_WEAPON: { name: 'Pre-loaded Weapon', cost: 400, desc: 'Start with random weapon', startWeapon: true },
  STARTING_SHIELD: { name: 'Shield Generator', cost: 350, desc: 'Start with 50 shields', shieldBonus: 50 },

  SHIELD_REGEN: { name: 'Shield Regeneration', cost: 700, desc: 'Shields regenerate over time', shieldRegen: true },
  MAGNET_RANGE: { name: 'Collector Beam', cost: 400, desc: 'Auto-collect nearby power-ups', magnetRange: 150 },

  POWER_DURATION: { name: 'Power Extension', cost: 500, desc: 'Power-ups last +50%', durationBonus: 0.5 },
  SCORE_BOOST: { name: 'Score Multiplier', cost: 800, desc: 'Permanent 1.5x score', scoreBonus: 0.5 },

  LUCKY_DROP: { name: 'Lucky Charm', cost: 450, desc: 'Power-ups drop 2x more', dropBonus: 1.0 },
  EXTRA_LIFE_START: { name: 'Emergency Systems', cost: 1000, desc: 'Revive once per game', revive: true },
};

const ACHIEVEMENTS = [
  { id: 'first_kill', name: 'First Blood', desc: 'Destroy your first enemy', reward: 25, tier: 'bronze' },
  { id: 'wave_5', name: 'Wave Warrior', desc: 'Reach wave 5', reward: 50, tier: 'bronze' },
  { id: 'first_boss', name: 'Boss Slayer', desc: 'Defeat your first boss', reward: 100, tier: 'bronze' },
  { id: 'streak_10', name: 'Combo Starter', desc: 'Get 10 kill streak', reward: 50, tier: 'bronze' },
  { id: 'power_collect', name: 'Powered Up', desc: 'Collect 10 power-ups', reward: 30, tier: 'bronze' },

  { id: 'wave_10', name: 'Wave Master', desc: 'Reach wave 10', reward: 100, tier: 'silver' },
  { id: 'enemies_100', name: 'Centurion', desc: 'Destroy 100 enemies', reward: 100, tier: 'silver' },
  { id: 'streak_50', name: 'Combo Master', desc: 'Get 50 kill streak', reward: 200, tier: 'silver' },
  { id: 'perfect_wave', name: 'Untouchable', desc: 'Clear wave without damage', reward: 150, tier: 'silver' },
  { id: 'all_bosses', name: 'Boss Hunter', desc: 'Defeat all 5 bosses', reward: 300, tier: 'silver' },

  { id: 'wave_20', name: 'Wave Legend', desc: 'Reach wave 20', reward: 250, tier: 'gold' },
  { id: 'enemies_500', name: 'Ace Pilot', desc: 'Destroy 500 enemies', reward: 300, tier: 'gold' },
  { id: 'score_100k', name: 'High Scorer', desc: 'Score 100,000 points', reward: 400, tier: 'gold' },
  { id: 'no_damage_boss', name: 'Flawless Victory', desc: 'Defeat boss without damage', reward: 500, tier: 'gold' },
  { id: 'all_upgrades', name: 'Fully Upgraded', desc: 'Buy all shop upgrades', reward: 600, tier: 'gold' },
];
