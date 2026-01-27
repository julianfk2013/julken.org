// Main game loop and state management

class TowerDefenseGame {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    this.ctx.imageSmoothingEnabled = false;

    // Game state
    this.state = 'menu'; // 'menu', 'playing', 'paused', 'victory', 'defeat'
    this.difficulty = null;
    this.map = null;
    this.path = [];

    // Resources
    this.money = CONFIG.START_MONEY;
    this.lives = CONFIG.START_LIVES;
    this.score = 0;

    // Wave management
    this.currentWave = 0;
    this.waveInProgress = false;
    this.waveDelay = 0;
    this.enemySpawner = null;

    // Game objects
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];

    // Decorations
    this.gridPulse = 0;

    // Audio
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.audioInitialized = false;
    this.musicPlaying = false;
    this.musicMuted = false;
    this.musicVolume = 0.4;

    // Preload music
    this.musicAudio = new Audio('prophecy.mp3');
    this.musicAudio.loop = true;
    this.musicAudio.volume = this.musicVolume;
    this.musicAudio.preload = 'auto';

    // UI
    this.ui = new GameUI(this);

    // Initialize audio on first user interaction (required by browsers)
    this.initAudioOnInteraction();

    // Setup
    this.setupCanvas();
    this.setupInputHandlers();
    this.setupTouchHandlers();

    // Load enemy sprites asynchronously
    assetLoader.loadAll().then(() => {
      console.log('Enemy sprites loaded');
    }).catch(err => {
      console.warn('Failed to load some sprites:', err);
    });

    // Start game loop
    this.lastTime = 0;
    requestAnimationFrame((t) => this.gameLoop(t));
  }


  initAudioOnInteraction() {
    const resumeAudio = () => {
      if (!this.audioInitialized && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.audioInitialized = true;
        });
      }
    };

    // Resume on any user interaction
    document.addEventListener('click', resumeAudio, { once: false });
    document.addEventListener('touchstart', resumeAudio, { once: false });
    document.addEventListener('keydown', resumeAudio, { once: false });
  }

  playSound(type) {
    // Ensure audio context is running
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const ctx = this.audioContext;

    switch(type) {
      case 'place': {
        // Tower placement - rising tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
        break;
      }
      case 'sell': {
        // Sell - descending tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        break;
      }
      case 'upgrade': {
        // Upgrade - triumphant arpeggio
        [0, 0.08, 0.16].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = [400, 500, 700][i];
          gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.15);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.15);
        });
        break;
      }
      case 'enemyDeath': {
        // Enemy death - quick pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
        break;
      }
      case 'laser': {
        // Laser shot - high pitched zap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
        break;
      }
      case 'rocket': {
        // Rocket launch - whoosh
        const noise = ctx.createOscillator();
        const gain = ctx.createGain();
        noise.type = 'sawtooth';
        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.frequency.setValueAtTime(150, ctx.currentTime);
        noise.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + 0.3);
        break;
      }
      case 'explosion': {
        // Explosion - low rumble
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
        break;
      }
      case 'tesla': {
        // Tesla zap - electric crackle
        [0, 0.03, 0.06].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 800 + Math.random() * 400;
          gain.gain.setValueAtTime(0.05, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.04);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.04);
        });
        break;
      }
      case 'plasma': {
        // Plasma - wobbly energy
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(400, ctx.currentTime + 0.05);
        osc.frequency.setValueAtTime(500, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
        break;
      }
      case 'waveStart': {
        // Wave start - alarm/siren
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(400, ctx.currentTime + 0.3);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
        break;
      }
      case 'waveComplete': {
        // Wave complete - victory fanfare
        [0, 0.1, 0.2, 0.3].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = [523, 659, 784, 1047][i]; // C, E, G, C (major chord)
          gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.3);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.3);
        });
        break;
      }
      case 'lifeLost': {
        // Life lost - descending warning
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        break;
      }
      case 'sniper': {
        // Sniper shot - sharp crack
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(2000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
        break;
      }
      case 'flame': {
        // Flame - rushing fire
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.1);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        break;
      }
      case 'railgun': {
        // Railgun - powerful charging beam
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
        break;
      }
      case 'freeze': {
        // Freeze - icy crystal sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(2000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        break;
      }
      case 'annihilator': {
        // Annihilator - massive destruction sound
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc2.type = 'square';
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
        osc2.frequency.setValueAtTime(200, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
        osc2.stop(ctx.currentTime + 0.35);
        break;
      }
    }
  }

  setupCanvas() {
    const resize = () => {
      const container = document.getElementById('game-container');
      const sidebar = document.getElementById('sidebar');
      const w = container.clientWidth - sidebar.offsetWidth;
      const h = container.clientHeight;

      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.canvas.width = w * this.DPR;
      this.canvas.height = h * this.DPR;
      this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
      this.ctx.imageSmoothingEnabled = false;

      this.canvasWidth = w;
      this.canvasHeight = h;

      // Calculate rendering offsets to center the grid (round to avoid sub-pixel issues)
      this.offsetX = Math.round((w - CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE) / 2);
      this.offsetY = Math.round((h - CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE) / 2);
    };

    window.addEventListener('resize', resize);
    resize();
  }

  setupInputHandlers() {
    this.canvas.addEventListener('click', (e) => {
      if (this.state !== 'playing') return;

      const rect = this.canvas.getBoundingClientRect();
      // Round coordinates to avoid sub-pixel alignment issues
      const x = Math.round(e.clientX - rect.left) - this.offsetX;
      const y = Math.round(e.clientY - rect.top) - this.offsetY;

      this.handleClick(x, y);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      // Round coordinates to avoid sub-pixel alignment issues
      this.mouseX = Math.round(e.clientX - rect.left) - this.offsetX;
      this.mouseY = Math.round(e.clientY - rect.top) - this.offsetY;
    });

    // Keyboard shortcut for pause
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (this.state === 'playing') {
          this.pause();
        } else if (this.state === 'paused') {
          this.resume();
        }
      }
    });
  }

  setupTouchHandlers() {
    // Touch support for mobile devices
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.state !== 'playing') return;

      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.round(touch.clientX - rect.left) - this.offsetX;
      const y = Math.round(touch.clientY - rect.top) - this.offsetY;

      // Update mouse position for preview
      this.mouseX = x;
      this.mouseY = y;

      this.handleClick(x, y);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = Math.round(touch.clientX - rect.left) - this.offsetX;
      this.mouseY = Math.round(touch.clientY - rect.top) - this.offsetY;
    }, { passive: false });
  }

  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      document.getElementById('pause-overlay').style.display = 'flex';
      document.getElementById('pause-btn').textContent = '▶️ Resume';
    }
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
      document.getElementById('pause-overlay').style.display = 'none';
      document.getElementById('pause-btn').textContent = '⏸️ Pause';
    }
  }

  toggleMute() {
    if (this.musicMuted) {
      this.unmuteMusic();
    } else {
      this.muteMusic();
    }
  }

  muteMusic() {
    this.musicMuted = true;
    if (this.musicAudio) {
      this.musicAudio.muted = true;
    }
    document.getElementById('music-btn').textContent = '🔇 Music';
    document.getElementById('music-btn').classList.remove('active');
  }

  unmuteMusic() {
    this.musicMuted = false;
    if (this.musicAudio) {
      this.musicAudio.muted = false;
    }
    document.getElementById('music-btn').textContent = '🔊 Music';
    document.getElementById('music-btn').classList.add('active');
  }

  setVolume(value) {
    // value is 0-100
    const volume = value / 100;
    if (this.musicAudio) {
      this.musicAudio.volume = volume;
    }
    this.musicVolume = volume;
  }

  startMusic() {
    if (this.musicPlaying) return;

    // Resume audio context first (required by browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Play with promise handling
    this.musicAudio.play().then(() => {
      console.log('Music started playing');
    }).catch(err => {
      console.warn('Music playback failed:', err);
    });

    this.musicPlaying = true;
    if (!this.musicMuted) {
      document.getElementById('music-btn').textContent = '🔊 Music';
      document.getElementById('music-btn').classList.add('active');
    }
  }

  stopMusic() {
    if (!this.musicPlaying) return;

    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
    }

    this.musicPlaying = false;
    document.getElementById('music-btn').textContent = '🔇 Music';
    document.getElementById('music-btn').classList.remove('active');
  }

  handleClick(x, y) {
    const gridPos = PathFinder.pixelToGrid(x, y);

    // Check if clicked on existing tower (works even in placement mode)
    for (const tower of this.towers) {
      if (tower.gridX === gridPos.x && tower.gridY === gridPos.y) {
        this.ui.selectTower(tower);
        return;
      }
    }

    // If in placement mode, try to build
    if (this.ui.selectedTowerType) {
      this.tryBuildTower(gridPos.x, gridPos.y, this.ui.selectedTowerType);
      return;
    }

    // Deselect tower if clicking on empty space
    this.ui.deselectTower();
  }

  canBuildAt(gridX, gridY) {
    // Validate bounds
    if (gridX < 0 || gridX >= CONFIG.GRID_WIDTH || gridY < 0 || gridY >= CONFIG.GRID_HEIGHT) {
      return false;
    }

    // Can't build on path
    if (PathFinder.isOnPath(gridX, gridY, this.map)) {
      return false;
    }

    // Can't build on another tower
    for (const tower of this.towers) {
      if (tower.gridX === gridX && tower.gridY === gridY) {
        return false;
      }
    }

    return true;
  }

  tryBuildTower(gridX, gridY, type) {
    // Validate placement
    if (!this.canBuildAt(gridX, gridY)) {
      return false;
    }

    // Check money
    const towerStats = TOWER_STATS[type];
    if (!towerStats) {
      console.error('Tower type not found:', type, '- Try hard refresh (Ctrl+Shift+R)');
      return false;
    }
    const cost = towerStats.cost[0];
    if (this.money < cost) {
      return false;
    }

    // Build tower
    this.money -= cost;
    const tower = new Tower(gridX, gridY, type);
    this.towers.push(tower);

    this.playSound('place');
    // Keep tower type selected for continuous placement

    return true;
  }

  upgradeTower(tower) {
    if (!tower.canUpgrade()) return false;

    const cost = tower.getUpgradeCost();
    if (this.money < cost) return false;

    this.money -= cost;
    tower.upgrade();
    this.playSound('upgrade');
    this.ui.updateTowerInfo();
    return true;
  }

  sellTower(tower) {
    const value = tower.getSellValue();
    this.money += value;

    const index = this.towers.indexOf(tower);
    if (index > -1) {
      this.towers.splice(index, 1);
    }

    this.playSound('sell');
    return true;
  }

  startGame(difficulty) {
    this.difficulty = difficulty;
    this.map = MAPS[difficulty];
    this.state = 'playing';

    // Reset game state
    this.money = CONFIG.START_MONEY;
    this.lives = CONFIG.START_LIVES;
    this.score = 0;
    this.currentWave = 0;
    this.waveInProgress = false;
    this.waveDelay = 0;

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];

    // Build path
    const startPositions = this.map.starts.map(s => PathFinder.gridToPixel(s.x, s.y));
    const pathGrid = this.map.pathTiles.map(t => PathFinder.gridToPixel(t[0], t[1]));
    this.path = pathGrid;
    this.startPositions = startPositions;

    // Autoplay music when game starts
    this.startMusic();
  }

  startNextWave() {
    // In endless mode, never stop generating waves
    if (this.waveInProgress) return;
    if (!this.map.endless && this.currentWave >= WAVES.length) return;

    this.currentWave++;
    this.waveInProgress = true;

    // Play wave start sound
    this.playSound('waveStart');

    // Show wave announcement
    this.ui.showWaveAnnouncement(this.currentWave);

    // Get wave config - use predefined or generate for endless
    let waveConfig;
    if (this.currentWave <= WAVES.length) {
      waveConfig = WAVES[this.currentWave - 1];
    } else {
      // Generate procedural wave for endless mode
      waveConfig = this.generateEndlessWave(this.currentWave);
    }

    this.enemySpawner = new EnemySpawner(waveConfig, this.path, this.startPositions);
  }

  generateEndlessWave(waveNum) {
    // Generate increasingly difficult waves with moderate scaling
    const difficulty = waveNum - 10; // Waves past 10

    // Gradual growth: each wave gets 15% more enemies (slower than before)
    const baseCount = Math.floor(12 * Math.pow(1.15, difficulty));

    // Spawn intervals get faster gradually
    const intervalMultiplier = Math.max(0.3, 1 - (difficulty * 0.05));

    // After wave 25, things get harder (but not crazy)
    const lateGameMultiplier = waveNum > 25 ? 1 + ((waveNum - 25) * 0.1) : 1;

    return {
      enemies: [
        {
          type: 'alien',
          count: Math.floor(baseCount * 1.5 * lateGameMultiplier),
          interval: Math.max(0.2, 0.3 * intervalMultiplier)
        },
        {
          type: 'scout',
          count: Math.floor(baseCount * 1.2 * lateGameMultiplier),
          interval: Math.max(0.2, 0.4 * intervalMultiplier)
        },
        {
          type: 'tank',
          count: Math.floor(baseCount * 0.5 * lateGameMultiplier),
          interval: Math.max(0.5, 1.2 * intervalMultiplier)
        },
        {
          type: 'ship',
          count: Math.floor(baseCount * 0.8 * lateGameMultiplier),
          interval: Math.max(0.4, 1.0 * intervalMultiplier)
        },
        {
          type: 'shielded',
          count: Math.floor(baseCount * 0.6 * lateGameMultiplier),
          interval: Math.max(0.5, 1.8 * intervalMultiplier)
        },
        {
          type: 'regenerator',
          count: Math.floor(baseCount * 0.5 * lateGameMultiplier),
          interval: Math.max(0.8, 2.5 * intervalMultiplier)
        },
        {
          type: 'splitter',
          count: Math.floor(baseCount * 0.6 * lateGameMultiplier),
          interval: Math.max(0.5, 2.0 * intervalMultiplier)
        }
      ]
    };
  }

  update(dt) {
    if (this.state !== 'playing') return;

    // Spawn enemies
    if (this.enemySpawner) {
      const newEnemies = this.enemySpawner.update(dt);
      this.enemies.push(...newEnemies);

      if (this.enemySpawner.completed && this.enemies.length === 0) {
        // Wave complete
        this.waveInProgress = false;
        this.enemySpawner = null;

        // Check victory only for non-endless modes
        if (!this.map.endless && this.currentWave >= WAVES.length) {
          // Victory!
          this.state = 'victory';
          this.ui.showVictory();
        } else {
          // Show wave complete popup and play sound
          this.ui.showWaveComplete();
          this.playSound('waveComplete');
        }
      }
    }

    // Update towers
    for (const tower of this.towers) {
      tower.update(dt, this.enemies, this.projectiles, this.particles);
      // Play tower firing sounds
      if (tower.firedThisFrame) {
        this.playSound(tower.type);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const wasExploded = proj.exploded;
      const newParticles = proj.update(dt, this.enemies);
      this.particles.push(...newParticles);

      // Play explosion sound for rockets
      if (!wasExploded && proj.exploded) {
        this.playSound('explosion');
      }

      if (proj.dead) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt);

      if (enemy.dead) {
        this.money += enemy.value;
        this.score += enemy.value * 10;
        this.playSound('enemyDeath');

        // Handle splitting enemies
        if (enemy.splits && !enemy.hasSplit && enemy.stats.splitType) {
          enemy.hasSplit = true;
          // Spawn 2 smaller enemies at parent's position
          for (let j = 0; j < 2; j++) {
            // Find the closest path point to the parent's current position
            let closestIndex = 0;
            let closestDist = Infinity;
            for (let k = 0; k < enemy.path.length; k++) {
              const dx = enemy.path[k].x - enemy.x;
              const dy = enemy.path[k].y - enemy.y;
              const dist = dx * dx + dy * dy;
              if (dist < closestDist) {
                closestDist = dist;
                closestIndex = k;
              }
            }

            const splitEnemy = new Enemy(enemy.stats.splitType, enemy.path, closestIndex);
            // Set position to parent's position with small offset
            splitEnemy.x = enemy.x + (Math.random() - 0.5) * 20;
            splitEnemy.y = enemy.y + (Math.random() - 0.5) * 20;
            this.enemies.push(splitEnemy);
          }
        }

        this.enemies.splice(i, 1);
      } else if (enemy.reachedEnd) {
        this.lives--;
        this.enemies.splice(i, 1);
        this.playSound('lifeLost');

        if (this.lives <= 0) {
          this.state = 'defeat';
          this.ui.showDefeat();
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.update(dt)) {
        this.particles.splice(i, 1);
      }
    }

    // Update UI
    this.ui.update();
  }

  draw() {
    const ctx = this.ctx;
    const time = performance.now() / 1000;

    // Draw vibrant gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
    bgGradient.addColorStop(0, '#1a0033');
    bgGradient.addColorStop(0.5, '#0d1929');
    bgGradient.addColorStop(1, '#001a33');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === 'menu') return;

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);

    // Draw vibrant grid background with gradient
    const gridGradient = ctx.createRadialGradient(
      CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE / 2,
      CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE / 2,
      0,
      CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE / 2,
      CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE / 2,
      Math.max(CONFIG.GRID_WIDTH, CONFIG.GRID_HEIGHT) * CONFIG.TILE_SIZE / 2
    );
    gridGradient.addColorStop(0, 'rgba(20,40,80,0.95)');
    gridGradient.addColorStop(0.5, 'rgba(15,30,60,0.9)');
    gridGradient.addColorStop(1, 'rgba(10,20,40,0.85)');
    ctx.fillStyle = gridGradient;
    ctx.fillRect(0, 0, CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE, CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE);

    // Draw subtle grid lines with modern style
    ctx.strokeStyle = 'rgba(100,150,255,0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CONFIG.GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CONFIG.TILE_SIZE, 0);
      ctx.lineTo(x * CONFIG.TILE_SIZE, CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= CONFIG.GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CONFIG.TILE_SIZE);
      ctx.lineTo(CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE);
      ctx.stroke();
    }

    // Draw colorful path with gradients
    for (let i = 0; i < this.map.pathTiles.length; i++) {
      const tile = this.map.pathTiles[i];
      const x = tile[0] * CONFIG.TILE_SIZE;
      const y = tile[1] * CONFIG.TILE_SIZE;

      // Vibrant tile gradient
      const tileGradient = ctx.createLinearGradient(x, y, x + CONFIG.TILE_SIZE, y + CONFIG.TILE_SIZE);
      tileGradient.addColorStop(0, '#2a5a8a');
      tileGradient.addColorStop(0.5, '#3a6a9a');
      tileGradient.addColorStop(1, '#2a5a8a');
      ctx.fillStyle = tileGradient;
      ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);

      // Animated energy flow
      const flowPhase = (time * 1.5 - i * 0.15) % 1;
      const flowAlpha = Math.sin(flowPhase * Math.PI) * 0.5 + 0.2;
      const flowGradient = ctx.createLinearGradient(x, y, x + CONFIG.TILE_SIZE, y + CONFIG.TILE_SIZE);
      flowGradient.addColorStop(0, `rgba(0, 200, 255, ${flowAlpha})`);
      flowGradient.addColorStop(0.5, `rgba(100, 255, 255, ${flowAlpha * 1.5})`);
      flowGradient.addColorStop(1, `rgba(0, 200, 255, ${flowAlpha})`);
      ctx.fillStyle = flowGradient;
      ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);

      // Border with glow
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 5;
      ctx.strokeRect(x + 1, y + 1, CONFIG.TILE_SIZE - 2, CONFIG.TILE_SIZE - 2);
      ctx.shadowBlur = 0;
    }

    // Draw vibrant base/objective at path end
    const endTile = this.map.pathTiles[this.map.pathTiles.length - 1];
    const baseX = endTile[0] * CONFIG.TILE_SIZE;
    const baseY = endTile[1] * CONFIG.TILE_SIZE;

    // Pulsing base with vibrant colors
    const basePulse = Math.sin(time * 2) * 0.3 + 0.7;
    ctx.save();
    ctx.translate(baseX + CONFIG.TILE_SIZE / 2, baseY + CONFIG.TILE_SIZE / 2);

    // Outer glow rings
    for (let i = 3; i >= 1; i--) {
      const ringPulse = Math.sin(time * 2 + i) * 0.2 + 0.8;
      ctx.strokeStyle = `rgba(0, 255, 200, ${0.3 / i})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00ffc8';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, 35 + i * 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Core crystal with gradient
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
    coreGradient.addColorStop(0, '#ffffff');
    coreGradient.addColorStop(0.4, '#00ffff');
    coreGradient.addColorStop(0.7, '#0088ff');
    coreGradient.addColorStop(1, '#0044ff');
    ctx.fillStyle = coreGradient;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 30 * basePulse;

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time * 0.5;
      const radius = 20 * basePulse;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Energy particles orbiting
    for (let i = 0; i < 6; i++) {
      const orbitAngle = time * 2 + (i / 6) * Math.PI * 2;
      const orbitRadius = 30;
      const px = Math.cos(orbitAngle) * orbitRadius;
      const py = Math.sin(orbitAngle) * orbitRadius;

      const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, 4);
      particleGradient.addColorStop(0, '#ffffff');
      particleGradient.addColorStop(0.5, '#00ffff');
      particleGradient.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = particleGradient;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    // Draw placement preview
    if (this.ui.selectedTowerType && this.mouseX !== undefined) {
      const gridPos = PathFinder.pixelToGrid(this.mouseX, this.mouseY);
      const canPlace = !PathFinder.isOnPath(gridPos.x, gridPos.y, this.map) &&
                       !this.towers.some(t => t.gridX === gridPos.x && t.gridY === gridPos.y) &&
                       gridPos.x >= 0 && gridPos.x < CONFIG.GRID_WIDTH &&
                       gridPos.y >= 0 && gridPos.y < CONFIG.GRID_HEIGHT;

      ctx.fillStyle = canPlace ? COLORS.buildable : COLORS.unbuildable;
      ctx.fillRect(
        gridPos.x * CONFIG.TILE_SIZE,
        gridPos.y * CONFIG.TILE_SIZE,
        CONFIG.TILE_SIZE,
        CONFIG.TILE_SIZE
      );

      // Draw range preview with dotted line
      const pos = PathFinder.gridToPixel(gridPos.x, gridPos.y);
      const stats = TOWER_STATS[this.ui.selectedTowerType];
      if (stats) {
        const range = stats.range[0]; // Level 1 range
        const time = performance.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.3 + 0.7;

        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = stats.color.replace(')', `, ${pulse * 0.8})`).replace('rgb', 'rgba');
        ctx.lineWidth = 3;
        ctx.shadowColor = stats.color;
        ctx.shadowBlur = 12 * pulse;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
      }
    }

    // Draw tower range if selected
    if (this.ui.selectedTower) {
      this.ui.selectedTower.drawRange(ctx);
    }

    // Draw towers
    for (const tower of this.towers) {
      tower.draw(ctx);
    }

    // Draw enemies
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }

    // Draw projectiles
    for (const proj of this.projectiles) {
      proj.draw(ctx);
    }

    // Draw particles
    for (const p of this.particles) {
      p.draw(ctx);
    }

    ctx.restore();
  }

  gameLoop(time) {
    const dt = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', () => {
  window.game = new TowerDefenseGame();

  // Expose for stress testing
  if (window.initStressTest) {
    window.initStressTest(window.game);
  }
});
