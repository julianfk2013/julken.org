// Game configuration - Tower stats, enemy stats, waves

const CONFIG = {
  // Grid settings
  TILE_SIZE: 32,
  GRID_WIDTH: 24,
  GRID_HEIGHT: 18,

  // Starting resources
  START_MONEY: 400,
  START_LIVES: 15,

  // Game balance
  WAVE_DELAY: 10, // Seconds between waves
};

// Tower statistics
const TOWER_STATS = {
  laser: {
    name: 'Laser Turret',
    cost: [100, 150, 200],
    damage: [10, 15, 25],
    range: [120, 140, 160],
    fireRate: [0.5, 0.4, 0.3],
    color: '#00d4ff',
    description: 'Fast-firing energy weapon'
  },
  rocket: {
    name: 'Rocket Launcher',
    cost: [150, 200, 300],
    damage: [25, 40, 60],
    range: [150, 170, 200],
    fireRate: [2.0, 1.5, 1.2],
    areaRadius: [40, 50, 60],
    color: '#ff3366',
    description: 'Explosive area damage'
  },
  plasma: {
    name: 'Plasma Cannon',
    cost: [120, 180, 250],
    damage: [15, 20, 30],
    range: [100, 120, 150],
    fireRate: [0.8, 0.6, 0.5],
    slowAmount: [0.3, 0.4, 0.5],
    slowDuration: 2.0,
    color: '#cc33ff',
    description: 'Slows enemies'
  },
  tesla: {
    name: 'Tesla Coil',
    cost: [200, 300, 400],
    damage: [8, 12, 18],
    range: [80, 100, 120],
    fireRate: [0.3, 0.25, 0.2],
    chainCount: [3, 4, 5],
    color: '#ffee00',
    description: 'Chain lightning'
  },
  sniper: {
    name: 'Sniper Tower',
    cost: [250, 350, 500],
    damage: [50, 80, 120],
    range: [250, 300, 350],
    fireRate: [3.0, 2.5, 2.0],
    color: '#00ff66',
    description: 'Long range, high damage'
  },
  flame: {
    name: 'Flame Thrower',
    cost: [180, 260, 380],
    damage: [5, 8, 12],
    range: [70, 85, 100],
    fireRate: [0.2, 0.15, 0.1],
    dotDamage: [3, 5, 8],
    dotDuration: 2.0,
    color: '#ff6600',
    description: 'Burns enemies over time'
  },
  railgun: {
    name: 'Railgun',
    cost: [300, 450, 650],
    damage: [40, 65, 100],
    range: [280, 320, 380],
    fireRate: [2.5, 2.0, 1.5],
    pierceCount: [4, 6, 999],
    color: '#00aaff',
    description: 'Pierces through enemies'
  },
  freeze: {
    name: 'Freeze Tower',
    cost: [160, 240, 340],
    damage: [5, 8, 12],
    range: [90, 110, 130],
    fireRate: [0.6, 0.5, 0.4],
    slowAmount: [0.6, 0.7, 0.8],
    slowDuration: [2.5, 3.0, 4.0],
    color: '#88ddff',
    description: 'Freezes enemies in place'
  },
  annihilator: {
    name: 'ANNIHILATOR',
    cost: [10000, 20000, 50000],
    damage: [9999, 99999, 999999],
    range: [500, 600, 999],
    fireRate: [0.1, 0.05, 0.02],
    areaRadius: [150, 200, 300],
    chainCount: [10, 20, 50],
    pierceCount: [999, 999, 999],
    slowAmount: [0.9, 0.95, 0.99],
    slowDuration: 5.0,
    color: '#ff0000',
    glowColor: '#ffff00',
    description: 'THE ULTIMATE WEAPON OF DESTRUCTION'
  }
};

// Enemy statistics
const ENEMY_STATS = {
  alien: {
    name: 'Alien',
    health: 65,
    speed: 70,
    value: 10,
    color: '#00ff88',
    size: 12,
    // Sprite sheet position (row, col) in ScifiCritters.png (32x32 grid)
    sprite: { sheet: 'critters', row: 0, col: 0 }
  },
  scout: {
    name: 'Scout',
    health: 40,
    speed: 140,
    value: 15,
    color: '#ff9944',
    size: 10,
    sprite: { sheet: 'critters', row: 0, col: 3 }
  },
  tank: {
    name: 'Tank',
    health: 280,
    speed: 35,
    value: 30,
    color: '#9966ff',
    size: 16,
    armor: 0.35, // Reduces damage by 35%
    sprite: { sheet: 'critters', row: 1, col: 0 }
  },
  ship: {
    name: 'Flying Ship',
    health: 100,
    speed: 90,
    value: 25,
    flying: true,
    color: '#ff66ff',
    size: 14,
    sprite: { image: 'ship' }
  },
  shielded: {
    name: 'Shielded Alien',
    health: 75,
    speed: 55,
    value: 20,
    color: '#44aaff',
    size: 13,
    shield: 45, // Shield absorbs damage first
    sprite: { sheet: 'critters', row: 0, col: 1 }
  },
  regenerator: {
    name: 'Regenerator',
    health: 130,
    speed: 50,
    value: 25,
    color: '#99ff44',
    size: 14,
    regen: 8, // HP per second
    sprite: { sheet: 'critters', row: 0, col: 2 }
  },
  splitter: {
    name: 'Splitter',
    health: 55,
    speed: 80,
    value: 15,
    color: '#ff55cc',
    size: 11,
    splits: true, // Splits into 2 smaller enemies
    splitType: 'alien',
    sprite: { sheet: 'critters', row: 0, col: 4 }
  }
};

// Enemy image assets configuration
const ENEMY_ASSETS = {
  spriteSheets: {
    critters: {
      src: 'tds_assets/ScifiCritters.png',
      tileSize: 32,
      cols: 5,
      rows: 5
    }
  },
  images: {
    ship: 'tds_assets/ship.png',
    ufo: 'tds_assets/alien_ufo.png'
  }
};

// Wave configurations - longer waves with more enemies
const WAVES = [
  // Wave 1
  {
    enemies: [
      { type: 'alien', count: 10, interval: 1.4 }
    ]
  },
  // Wave 2
  {
    enemies: [
      { type: 'alien', count: 15, interval: 1.2 }
    ]
  },
  // Wave 3
  {
    enemies: [
      { type: 'alien', count: 18, interval: 1.0 },
      { type: 'scout', count: 6, interval: 1.8 }
    ]
  },
  // Wave 4
  {
    enemies: [
      { type: 'alien', count: 22, interval: 0.9 },
      { type: 'scout', count: 10, interval: 1.4 }
    ]
  },
  // Wave 5
  {
    enemies: [
      { type: 'alien', count: 25, interval: 0.8 },
      { type: 'scout', count: 14, interval: 1.2 },
      { type: 'tank', count: 3, interval: 4.0 }
    ]
  },
  // Wave 6
  {
    enemies: [
      { type: 'alien', count: 30, interval: 0.7 },
      { type: 'scout', count: 18, interval: 1.0 },
      { type: 'tank', count: 5, interval: 3.0 },
      { type: 'shielded', count: 4, interval: 3.5 }
    ]
  },
  // Wave 7
  {
    enemies: [
      { type: 'alien', count: 35, interval: 0.6 },
      { type: 'scout', count: 22, interval: 0.9 },
      { type: 'tank', count: 6, interval: 2.5 },
      { type: 'ship', count: 6, interval: 3.0 },
      { type: 'shielded', count: 6, interval: 2.8 }
    ]
  },
  // Wave 8
  {
    enemies: [
      { type: 'alien', count: 40, interval: 0.5 },
      { type: 'scout', count: 25, interval: 0.7 },
      { type: 'tank', count: 8, interval: 2.0 },
      { type: 'ship', count: 10, interval: 2.5 },
      { type: 'shielded', count: 8, interval: 2.2 },
      { type: 'regenerator', count: 4, interval: 4.0 }
    ]
  },
  // Wave 9
  {
    enemies: [
      { type: 'alien', count: 50, interval: 0.4 },
      { type: 'scout', count: 30, interval: 0.6 },
      { type: 'tank', count: 10, interval: 1.8 },
      { type: 'ship', count: 14, interval: 2.0 },
      { type: 'shielded', count: 10, interval: 1.8 },
      { type: 'regenerator', count: 6, interval: 3.5 },
      { type: 'splitter', count: 6, interval: 3.0 }
    ]
  },
  // Wave 10 (Final)
  {
    enemies: [
      { type: 'alien', count: 60, interval: 0.35 },
      { type: 'scout', count: 40, interval: 0.5 },
      { type: 'tank', count: 12, interval: 1.5 },
      { type: 'ship', count: 18, interval: 1.5 },
      { type: 'shielded', count: 14, interval: 1.5 },
      { type: 'regenerator', count: 8, interval: 3.0 },
      { type: 'splitter', count: 10, interval: 2.5 }
    ]
  }
];

// Map definitions
const MAPS = {
  easy: {
    name: 'Easy - Single Path',
    starts: [{x: 0, y: 9}],
    end: {x: 23, y: 9},
    endless: false,
    pathTiles: [
      // Predefined path from left to right with turns
      [0,9],[1,9],[2,9],[3,9],[4,9],[5,9],[6,9],[7,9],
      [7,8],[7,7],[7,6],[7,5],
      [8,5],[9,5],[10,5],[11,5],[12,5],
      [12,6],[12,7],[12,8],[12,9],[12,10],[12,11],
      [13,11],[14,11],[15,11],[16,11],[17,11],[18,11],[19,11],
      [19,10],[19,9],[20,9],[21,9],[22,9],[23,9]
    ]
  },
  hard: {
    name: 'Hard - Multiple Paths',
    starts: [
      {x: 0, y: 6},
      {x: 0, y: 12}
    ],
    end: {x: 23, y: 9},
    endless: false,
    pathTiles: [
      // Path 1 (top)
      [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],
      [10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],[17,6],[18,6],
      [18,7],[18,8],[18,9],[19,9],[20,9],[21,9],[22,9],[23,9],
      // Path 2 (bottom)
      [0,12],[1,12],[2,12],[3,12],[4,12],[5,12],[6,12],[7,12],[8,12],
      [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
      [17,12],[18,12],[18,11],[18,10],[18,9]
    ]
  },
  'endless-easy': {
    name: 'Endless - Single Path',
    starts: [{x: 0, y: 9}],
    end: {x: 23, y: 9},
    endless: true,
    pathTiles: [
      // Same path as easy mode
      [0,9],[1,9],[2,9],[3,9],[4,9],[5,9],[6,9],[7,9],
      [7,8],[7,7],[7,6],[7,5],
      [8,5],[9,5],[10,5],[11,5],[12,5],
      [12,6],[12,7],[12,8],[12,9],[12,10],[12,11],
      [13,11],[14,11],[15,11],[16,11],[17,11],[18,11],[19,11],
      [19,10],[19,9],[20,9],[21,9],[22,9],[23,9]
    ]
  },
  'endless-hard': {
    name: 'Endless - Multiple Paths',
    starts: [
      {x: 0, y: 6},
      {x: 0, y: 12}
    ],
    end: {x: 23, y: 9},
    endless: true,
    pathTiles: [
      // Same paths as hard mode
      [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],
      [10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],[17,6],[18,6],
      [18,7],[18,8],[18,9],[19,9],[20,9],[21,9],[22,9],[23,9],
      [0,12],[1,12],[2,12],[3,12],[4,12],[5,12],[6,12],[7,12],[8,12],
      [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
      [17,12],[18,12],[18,11],[18,10],[18,9]
    ]
  }
};

// Colors
const COLORS = {
  bg: '#0a0e1a',
  grid: '#1a2332',
  path: '#2d3a4f',
  pathBorder: '#3d4a5f',
  buildable: 'rgba(0,255,136,0.25)',
  unbuildable: 'rgba(255,68,68,0.3)',
  rangeIndicator: 'rgba(0,212,255,0.2)',
  rangeIndicatorBorder: 'rgba(0,212,255,0.6)',
};
