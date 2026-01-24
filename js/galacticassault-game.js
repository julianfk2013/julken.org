const Game = {
  canvas: null,
  ctx: null,
  state: 'menu',
  mode: 'classic',

  player: null,
  bullets: [],
  enemies: [],
  enemyBullets: [],
  powerups: [],
  coins: [],
  boss: null,
  particles: [],
  damagePopups: [],

  wave: 1,
  enemiesRemaining: 0,
  enemySpawnTimer: 0,
  waveCompleteTimer: 0,
  currentFormation: null,
  formationIndex: 0,

  keys: {},
  mouseX: 0,
  mouseY: 0,
  isShooting: false,

  listeners: {
    resize: null,
    keydown: null,
    keyup: null,
    mousemove: null,
    mousedown: null,
    mouseup: null,
    contextmenu: null,
    touchstart: null,
    touchend: null,
    touchmove: null
  },

  score: 0,
  combo: 1.0,
  killStreak: 0,
  streakTimer: 0,
  enemiesDestroyed: 0,
  bossesDefeated: 0,

  activePowerups: [],

  lastTime: 0,
  deltaTime: 0,
  gameTime: 0,

  screenShake: 0,
  timeScale: 1.0,

  frameCount: 0,

  uiParticles: [],
  energyStreams: [],
  shockwaves: [],
  explosionFlash: null,
  glitchEffect: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.resizeCanvas();
    this.listeners.resize = () => this.resizeCanvas();
    window.addEventListener('resize', this.listeners.resize);

    Background.init(CONFIG.WIDTH, CONFIG.HEIGHT);

    this.setupInput();

    this.loadAssets();
  },

  cleanup() {
    if (this.listeners.resize) window.removeEventListener('resize', this.listeners.resize);
    if (this.listeners.keydown) window.removeEventListener('keydown', this.listeners.keydown);
    if (this.listeners.keyup) window.removeEventListener('keyup', this.listeners.keyup);
    if (this.listeners.blur) window.removeEventListener('blur', this.listeners.blur);
    if (this.listeners.mousemove) this.canvas.removeEventListener('mousemove', this.listeners.mousemove);
    if (this.listeners.mousedown) this.canvas.removeEventListener('mousedown', this.listeners.mousedown);
    if (this.listeners.mouseup) this.canvas.removeEventListener('mouseup', this.listeners.mouseup);
    if (this.listeners.contextmenu) this.canvas.removeEventListener('contextmenu', this.listeners.contextmenu);
    if (this.listeners.touchstart) this.canvas.removeEventListener('touchstart', this.listeners.touchstart);
    if (this.listeners.touchend) this.canvas.removeEventListener('touchend', this.listeners.touchend);
    if (this.listeners.touchmove) this.canvas.removeEventListener('touchmove', this.listeners.touchmove);
    if (this.listeners.orientationchange) window.removeEventListener('orientationchange', this.listeners.orientationchange);

    this.listeners = {
      resize: null,
      keydown: null,
      keyup: null,
      blur: null,
      mousemove: null,
      mousedown: null,
      mouseup: null,
      contextmenu: null,
      touchstart: null,
      touchend: null,
      touchmove: null
    };
  },

  resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const aspectRatio = CONFIG.WIDTH / CONFIG.HEIGHT;

    let width = container.clientWidth;
    let height = container.clientHeight;

    if (width / height > aspectRatio) {
      width = height * aspectRatio;
    } else {
      height = width / aspectRatio;
    }

    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
  },

  loadAssets() {
    this.state = 'loading';

    AssetLoader.init(
      (loaded, total) => {
        const progress = (loaded / total) * 100;
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        this.ctx.fillStyle = '#38bdf8';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading Assets...', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 30);

        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(CONFIG.WIDTH / 2 - 200, CONFIG.HEIGHT / 2, 400, 30);

        this.ctx.fillStyle = '#38bdf8';
        this.ctx.fillRect(CONFIG.WIDTH / 2 - 200, CONFIG.HEIGHT / 2, 400 * (progress / 100), 30);

        this.ctx.fillStyle = 'white';
        this.ctx.fillText(`${Math.floor(progress)}%`, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 20);
      },
      () => {
        this.state = 'menu';
        this.startGameLoop();
      }
    );
  },

  setupInput() {
    this.listeners.keydown = e => {
      this.keys[e.key.toLowerCase()] = true;

      if (e.key === 'Escape' && (this.state === 'playing' || this.state === 'boss')) {
        this.pause();
      }

      if (e.key === ' ' && (this.state === 'playing' || this.state === 'boss')) {
        this.isShooting = true;
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', this.listeners.keydown);

    this.listeners.keyup = e => {
      this.keys[e.key.toLowerCase()] = false;

      if (e.key === ' ') {
        this.isShooting = false;
      }
    };
    window.addEventListener('keyup', this.listeners.keyup);

    this.listeners.blur = () => {
      this.keys = {};
      this.isShooting = false;
    };
    window.addEventListener('blur', this.listeners.blur);

    this.listeners.mousemove = e => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CONFIG.WIDTH / rect.width;
      const scaleY = CONFIG.HEIGHT / rect.height;

      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
    };
    this.canvas.addEventListener('mousemove', this.listeners.mousemove);

    this.listeners.mousedown = e => {
      if (this.state === 'playing' || this.state === 'boss') {
        this.isShooting = true;
        e.preventDefault();
      }
    };
    this.canvas.addEventListener('mousedown', this.listeners.mousedown);

    this.listeners.mouseup = e => {
      this.isShooting = false;
    };
    this.canvas.addEventListener('mouseup', this.listeners.mouseup);

    this.listeners.touchstart = e => {
      if (this.state === 'playing' || this.state === 'boss') {
        this.isShooting = true;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = CONFIG.WIDTH / rect.width;
        const scaleY = CONFIG.HEIGHT / rect.height;
        const touch = e.touches[0];

        this.mouseX = (touch.clientX - rect.left) * scaleX;
        this.mouseY = (touch.clientY - rect.top) * scaleY;

        e.preventDefault();
      }
    };
    this.canvas.addEventListener('touchstart', this.listeners.touchstart, { passive: false });

    this.listeners.touchmove = e => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CONFIG.WIDTH / rect.width;
      const scaleY = CONFIG.HEIGHT / rect.height;
      const touch = e.touches[0];

      this.mouseX = (touch.clientX - rect.left) * scaleX;
      this.mouseY = (touch.clientY - rect.top) * scaleY;
      e.preventDefault();
    };
    this.canvas.addEventListener('touchmove', this.listeners.touchmove, { passive: false });

    this.listeners.touchend = e => {
      this.isShooting = false;
      e.preventDefault();
    };
    this.canvas.addEventListener('touchend', this.listeners.touchend, { passive: false });

    this.listeners.orientationchange = () => {
      if (this.state === 'playing' || this.state === 'boss') {
        this.pause();
      }
    };
    window.addEventListener('orientationchange', this.listeners.orientationchange);
  },

  createSeededRandom(seed) {
    let state = seed;
    return function() {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  },

  startGame(mode = 'classic', bossRushDifficulty = 1) {
    this.setupInput();

    this.mode = mode;
    this.state = 'playing';

    this.wave = 1;
    this.score = 0;
    this.combo = 1.0;
    this.killStreak = 0;
    this.streakTimer = 0;
    this.enemiesDestroyed = 0;
    this.bossesDefeated = 0;
    this.gameTime = 0;
    this.timeScale = 1.0;

    this.modeTimer = 0;
    this.survivalDifficulty = 1.0;
    this.waveStartTime = 0;
    this.bossRushDifficulty = bossRushDifficulty;

    if (mode === 'daily') {
      const today = new Date();
      this.dailySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      this.seededRandom = this.createSeededRandom(this.dailySeed);
    }

    this.bullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.powerups = [];
    this.coins = [];
    this.healthBonuses = [];
    this.particles = [];
    this.damagePopups = [];
    this.activePowerups = [];
    this.boss = null;

    this.uiParticles = [];
    this.energyStreams = [];
    this.shockwaves = [];
    this.explosionFlash = null;
    this.glitchEffect = null;

    this.currentFormation = null;
    this.formationIndex = 0;

    this.isShooting = false;
    this.screenShake = 0;

    this.player = new Player(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 100);

    if (mode === 'zen') {
      this.player.hp = 999999;
      this.player.maxHp = 999999;
      this.player.invulnerable = true;
    }

    this.applyUpgrades();

    this.startWave();

    const stats = Storage.getStats();
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    Storage.updateStats(stats);

    AudioManager.playMusic();
  },

  applyUpgrades() {
  },

  generateFormation(formationKey) {
    const pattern = FORMATION_PATTERNS[formationKey];
    if (!pattern || !pattern.positions) {
      console.warn('Formation pattern not found:', formationKey);
      return [
        { x: CONFIG.WIDTH * 0.3, y: -50 },
        { x: CONFIG.WIDTH * 0.5, y: -100 },
        { x: CONFIG.WIDTH * 0.7, y: -150 },
      ];
    }

    return pattern.positions.map(pos => ({
      x: pos.x * CONFIG.WIDTH,
      y: 80 + (pos.y * 140),
    }));
  },

  startWave() {
    this.enemiesRemaining = this.getEnemiesForWave();
    this.enemySpawnTimer = 0;

    if (this.mode === 'bossrush') {
      this.startBossWave();
      return;
    }

    if (this.mode === 'daily') {
      this.startBossWave();
      return;
    }

    if (this.mode === 'zen') {
      const formationKeys = Object.keys(FORMATIONS);
      const randomFormationKey = formationKeys[Math.floor(Math.random() * formationKeys.length)];
      this.currentFormation = this.generateFormation(FORMATIONS[randomFormationKey]);
      this.formationIndex = 0;
      return;
    }

    if (this.wave % CONFIG.BOSS_EVERY_N_WAVES === 0) {
      this.startBossWave();
    } else {
      const formationKeys = Object.keys(FORMATIONS);
      const randomFormationKey = formationKeys[Math.floor(Math.random() * formationKeys.length)];
      this.currentFormation = this.generateFormation(FORMATIONS[randomFormationKey]);
      this.formationIndex = 0;
    }
  },

  getEnemiesForWave() {
    if (this.mode === 'bossrush' || this.mode === 'daily') {
      return 0;
    }

    if (this.mode === 'survival') {
      const base = CONFIG.ENEMIES_PER_WAVE_BASE;
      const increment = CONFIG.ENEMIES_PER_WAVE_INCREMENT * 1.5;
      return Math.floor(base + (this.wave - 1) * increment * this.survivalDifficulty);
    }

    if (this.mode === 'timeattack') {
      return CONFIG.ENEMIES_PER_WAVE_BASE + (this.wave - 1) * 2;
    }

    return CONFIG.ENEMIES_PER_WAVE_BASE +
           (this.wave - 1) * CONFIG.ENEMIES_PER_WAVE_INCREMENT;
  },

  startBossWave() {
    if (this.mode === 'bossrush') {
      this.state = 'boss';
      const bossNumber = Math.min(5, Math.ceil(this.wave / CONFIG.BOSS_EVERY_N_WAVES));
      const bossConfig = BOSS_CONFIGS[bossNumber];
      this.boss = new Boss(this.wave, bossConfig);
      this.boss.bossNumber = bossNumber;

      const difficultyLevel = this.bossRushDifficulty || 1;
      const rushMultiplier = 1 + (this.wave - 1) * (0.15 * difficultyLevel);
      this.boss.hp *= rushMultiplier;
      this.boss.maxHp = this.boss.hp;
      this.boss.attackInterval = Math.max(600, this.boss.attackInterval - (this.wave - 1) * (50 * difficultyLevel));

      AudioManager.playSound('bossEnter');
      return;
    }

    if (this.mode === 'daily') {
      this.state = 'boss';
      this.bosses = [];

      for (let i = 0; i < 5; i++) {
        const bossNumber = Math.min(5, Math.ceil(this.wave / CONFIG.BOSS_EVERY_N_WAVES));
        const bossConfig = BOSS_CONFIGS[bossNumber];
        const boss = new Boss(this.wave, bossConfig);
        boss.bossNumber = bossNumber;

        boss.x = (CONFIG.WIDTH / 6) * (i + 1) - boss.width / 2;
        boss.y = 60 + i * 10;
        boss.targetY = 60 + i * 10;

        boss.attackTimer = i * 1000;

        boss.isChallengeBoss = true;
        boss.attackInterval = 2000 + (i * 500);

        this.bosses.push(boss);
      }

      AudioManager.playSound('bossEnter');
      return;
    }

    this.state = 'paused';
    UI.showBossWarning();

    this.pendingBossNumber = Math.min(5, Math.ceil(this.wave / CONFIG.BOSS_EVERY_N_WAVES));
    this.pendingBossConfig = BOSS_CONFIGS[this.pendingBossNumber];
  },

  startBossFight() {
    this.state = 'boss';
    this.boss = new Boss(this.wave, this.pendingBossConfig);
    this.boss.bossNumber = this.pendingBossNumber;

    AudioManager.playSound('bossEnter');
  },

  startGameLoop() {
    this.lastTime = performance.now();

    const loop = (currentTime) => {
      this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1) * this.timeScale;
      this.lastTime = currentTime;

      this.update(this.deltaTime);
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  },

  update(dt) {
    if (this.state !== 'playing' && this.state !== 'boss') return;

    if (!this.player && (this.state === 'playing' || this.state === 'boss')) {
      console.error('❌ Player is null during gameplay!');
      this.gameOver();
      return;
    }

    this.frameCount++;
    this.gameTime += dt;

    if (this.mode === 'survival') {
      this.survivalDifficulty += dt * 0.05;

      const speedMultiplier = 1 + (this.survivalDifficulty - 1) * 0.3;
      this.enemies.forEach(enemy => {
        enemy.speedMultiplier = speedMultiplier;
      });
      this.enemyBullets.forEach(bullet => {
        bullet.speedMultiplier = speedMultiplier;
      });
    }

    if (this.mode === 'zen') {
      this.enemies.forEach(enemy => {
        enemy.speedMultiplier = 0.5;
      });
      this.enemyBullets.forEach(bullet => {
        bullet.speedMultiplier = 0.5;
      });
    }

    if (this.mode === 'timeattack') {
      this.modeTimer += dt;
    }

    Background.update(dt);

    if (this.player) {
      this.player.update(dt, this.keys, this.mouseX, CONFIG.WIDTH, CONFIG.HEIGHT);

      if (this.isShooting && this.player.shoot()) {
        this.createPlayerBullet();
      }
    }

    this.bullets = this.bullets.filter(bullet => {
      bullet.update(dt, this.enemies);
      return bullet.y > -50 && bullet.x > -50 && bullet.x < CONFIG.WIDTH + 50;
    });

    this.enemies = this.enemies.filter(enemy => {
      enemy.update(dt, this.player ? this.player.x : 0, this.player ? this.player.y : 0, CONFIG.WIDTH, this.bullets);

      if (enemy.canShoot()) {
        this.createEnemyBullet(enemy);
      }

      return enemy.y < CONFIG.HEIGHT + 100 && enemy.hp > 0;
    });

    this.separateEntities(this.enemies);

    this.enemyBullets = this.enemyBullets.filter(bullet => {
      bullet.update(dt);
      return bullet.y < CONFIG.HEIGHT + 50;
    });

    if (this.mode === 'daily' && this.bosses && this.bosses.length > 0) {
      for (let i = this.bosses.length - 1; i >= 0; i--) {
        const boss = this.bosses[i];
        boss.update(dt, CONFIG.WIDTH, this.player ? this.player.x : 0, this.player ? this.player.y : 0);

        if (boss.projectiles && boss.projectiles.length > 0) {
          boss.projectiles.forEach(proj => {
            if (proj && typeof proj.x === 'number' && typeof proj.y === 'number' &&
                typeof proj.vx === 'number' && typeof proj.vy === 'number' &&
                !isNaN(proj.x) && !isNaN(proj.y) && !isNaN(proj.vx) && !isNaN(proj.vy)) {
              const bullet = new EnemyBullet(
                proj.x,
                proj.y,
                proj.vx,
                proj.vy
              );
              this.enemyBullets.push(bullet);
            } else {
              console.warn('⚠️ Invalid boss projectile:', proj);
            }
          });
          boss.projectiles = [];
        }

        if (boss.hp <= 0) {
          this.defeatChallengeBoss(boss, i);
        }
      }

      this.separateEntities(this.bosses);
    } else if (this.boss) {
      this.boss.update(dt, CONFIG.WIDTH, this.player ? this.player.x : 0, this.player ? this.player.y : 0);

      if (this.boss.projectiles && this.boss.projectiles.length > 0) {
        this.boss.projectiles.forEach(proj => {
          if (proj && typeof proj.x === 'number' && typeof proj.y === 'number' &&
              typeof proj.vx === 'number' && typeof proj.vy === 'number' &&
              !isNaN(proj.x) && !isNaN(proj.y) && !isNaN(proj.vx) && !isNaN(proj.vy)) {
            const bullet = new EnemyBullet(
              proj.x,
              proj.y,
              proj.vx,
              proj.vy
            );
            this.enemyBullets.push(bullet);
          } else {
            console.warn('⚠️ Invalid boss projectile:', proj);
          }
        });
        this.boss.projectiles = [];
      }

      if (this.boss.hp <= 0) {
        this.defeatBoss();
      }
    }

    const magnetRange = this.player?.magnetRange || 0;
    const playerCenterX = this.player ? this.player.x + this.player.width / 2 : 0;
    const playerCenterY = this.player ? this.player.y + this.player.height / 2 : 0;

    this.coins = this.coins.filter(coin => {
      if (this.player && magnetRange > 0) {
        const dx = playerCenterX - (coin.x + coin.width / 2);
        const dy = playerCenterY - (coin.y + coin.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < magnetRange && distance > 0) {
          const magnetStrength = 400;
          coin.vx = (dx / distance) * magnetStrength * dt;
          coin.vy = (dy / distance) * magnetStrength * dt;
        }
      }
      coin.update(dt);
      return coin.y < CONFIG.HEIGHT + 50;
    });

    this.healthBonuses = this.healthBonuses.filter(bonus => {
      if (this.player && magnetRange > 0) {
        const dx = playerCenterX - (bonus.x + bonus.width / 2);
        const dy = playerCenterY - (bonus.y + bonus.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < magnetRange && distance > 0) {
          const magnetStrength = 400;
          bonus.vx = (dx / distance) * magnetStrength * dt;
          bonus.vy = (dy / distance) * magnetStrength * dt;
        }
      }
      bonus.update(dt);
      return bonus.y < CONFIG.HEIGHT + 50;
    });

    this.particles = this.particles.filter(particle => {
      particle.update(dt);
      return particle.life > 0;
    });

    this.damagePopups = this.damagePopups.filter(popup => {
      popup.update(dt);
      return !popup.isDead();
    });

    this.updateActivePowerups(dt);

    if (this.killStreak > 0) {
      this.streakTimer -= dt;
      if (this.streakTimer <= 0) {
        this.killStreak = 0;
        this.combo = 1.0;
      }
    }

    this.checkCollisions();

    const hasBoss = this.boss || (this.bosses && this.bosses.length > 0);
    if (this.state === 'playing' && !hasBoss) {
      this.spawnEnemies(dt);
    }

    if (this.enemiesRemaining === 0 && this.enemies.length === 0 && !hasBoss) {
      this.waveCompleteTimer += dt * 1000;
      if (this.waveCompleteTimer >= CONFIG.WAVE_CLEAR_DELAY) {
        this.nextWave();
      }
    }

    if (this.screenShake > 0) {
      this.screenShake *= CONFIG.SCREEN_SHAKE_DECAY;
      if (this.screenShake < 0.1) this.screenShake = 0;
    }

    if (this.frameCount % 5 === 0 && this.uiParticles.length < 100) {
      this.uiParticles.push({
        x: Math.random() < 0.5 ? Math.random() * 100 : CONFIG.WIDTH - Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 20,
        vy: Math.random() * 30 + 10,
        size: 1 + Math.random() * 2,
        life: 2 + Math.random(),
        maxLife: 2 + Math.random(),
        color: '#38bdf8',
        alpha: 0.5 + Math.random() * 0.5
      });
    }

    this.uiParticles = this.uiParticles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      return p.life > 0 && p.y < CONFIG.HEIGHT + 50;
    });

    if (Math.random() < 0.01 && this.energyStreams.length < 5) {
      this.energyStreams.push({
        x: Math.random() < 0.5 ? -50 : CONFIG.WIDTH + 50,
        y: Math.random() * CONFIG.HEIGHT,
        vx: Math.random() < 0.5 ? 200 : -200,
        width: 100 + Math.random() * 100,
        life: 2
      });
    }

    this.energyStreams = this.energyStreams.filter(s => {
      s.x += s.vx * dt;
      s.life -= dt;
      return s.life > 0;
    });

    if (this.shockwaves) {
      this.shockwaves = this.shockwaves.filter(wave => {
        wave.radius += wave.maxRadius * dt * 4;
        wave.life -= dt;
        return wave.life > 0;
      });
    }

    if (this.explosionFlash) {
      this.explosionFlash.life -= dt;
      if (this.explosionFlash.life <= 0) {
        this.explosionFlash = null;
      }
    }

    if (this.glitchEffect && this.glitchEffect.active) {
      this.glitchEffect.timer += dt;
      if (this.glitchEffect.timer >= this.glitchEffect.duration) {
        this.glitchEffect.active = false;
      }
    }

    if (Math.random() < 0.02) {
      this.glitchEffect = {
        active: true,
        duration: 0.1,
        timer: 0,
        offset: Math.random() * 20 - 10
      };
    }

    UI.updateHUD(this);
  },

  createPlayerBullet() {
    const weapon = this.getActiveWeapon();
    const centerX = this.player.x + this.player.width / 2;
    const centerY = this.player.y;
    const damageMultiplier = this.player.damageMultiplier || 1;

    if (weapon === 'spread') {
      for (let i = -1; i <= 1; i++) {
        const angle = i * CONFIG.SPREAD_ANGLE + this.player.rotation;
        const bullet = new Bullet(centerX, centerY, 'normal', angle);
        bullet.damage *= damageMultiplier;
        this.bullets.push(bullet);
      }
    } else if (weapon === 'laser') {
      const bullet = new Bullet(centerX, centerY, 'laser', this.player.rotation);
      bullet.damage *= damageMultiplier;
      this.bullets.push(bullet);
    } else if (weapon === 'homing') {
      const bullet = new Bullet(centerX, centerY, 'homing', this.player.rotation);
      bullet.damage *= damageMultiplier;
      this.bullets.push(bullet);
    } else if (weapon === 'wave') {
      const bullet = new Bullet(centerX, centerY, 'wave', this.player.rotation);
      bullet.damage *= damageMultiplier;
      this.bullets.push(bullet);
    } else {
      const bullet = new Bullet(centerX, centerY, 'normal', this.player.rotation);
      bullet.damage *= damageMultiplier;
      this.bullets.push(bullet);
    }

    AudioManager.playSound('playerShoot', 0.1);
  },

  getActiveWeapon() {
    for (const powerup of this.activePowerups) {
      if (powerup.props.isWeapon) {
        return powerup.type;
      }
    }
    return 'normal';
  },

  createEnemyBullet(enemy) {
    const props = ENEMY_PROPS[enemy.type];

    const shouldAim = Math.random() < 0.7;

    if (shouldAim && this.player) {
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const vx = (dx / dist) * CONFIG.ENEMY_BULLET_SPEED;
      const vy = (dy / dist) * CONFIG.ENEMY_BULLET_SPEED;

      this.enemyBullets.push(new EnemyBullet(enemy.x, enemy.y, vx, vy));
    } else {
      this.enemyBullets.push(new EnemyBullet(enemy.x, enemy.y, 0, CONFIG.ENEMY_BULLET_SPEED));
    }

    AudioManager.playSound('enemyShoot', 0.15);
  },

  spawnEnemies(dt) {
    if (this.enemiesRemaining <= 0) return;

    this.enemySpawnTimer += dt * 1000;

    let spawnDelay = CONFIG.FORMATION_SPAWN_DELAY;
    if (this.mode === 'timeattack') {
      spawnDelay = 50;
    } else if (this.mode === 'survival') {
      spawnDelay = CONFIG.FORMATION_SPAWN_DELAY / this.survivalDifficulty;
    }

    if (this.enemySpawnTimer >= spawnDelay) {
      this.enemySpawnTimer = 0;

      if (!this.currentFormation || this.formationIndex >= this.currentFormation.length) {
        this.formationIndex = 0;
      }

      if (!this.currentFormation || this.currentFormation.length === 0) {
        console.warn('⚠️ No formation available to spawn from');
        return;
      }

      const spawnData = this.currentFormation[this.formationIndex];
      const enemyType = this.getEnemyTypeForWave();

      const randomOffsetX = (Math.random() - 0.5) * 100;
      const randomOffsetY = (Math.random() - 0.5) * 50;

      const enemy = new Enemy(
        spawnData.x + randomOffsetX,
        spawnData.y + randomOffsetY,
        enemyType
      );
      this.enemies.push(enemy);

      this.formationIndex++;
      this.enemiesRemaining--;
    }
  },

  getEnemyTypeForWave() {
    if (this.wave <= 3) {
      return Math.floor(Math.random() * 3);
    } else if (this.wave <= 6) {
      return Math.floor(Math.random() * 6);
    } else if (this.wave <= 9) {
      return Math.floor(Math.random() * 9);
    } else {
      return Math.floor(Math.random() * 14);
    }
  },

  checkCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      let hit = false;

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];

        if (this.rectCollision(bullet, enemy)) {
          enemy.takeDamage(bullet.damage);

          if (enemy.hp <= 0) {
            this.destroyEnemy(enemy, j);
          }

          if (bullet.type !== 'laser') {
            hit = true;
          }

          break;
        }
      }

      if (hit) {
        this.bullets.splice(i, 1);
      }
    }

    if (this.bosses && this.bosses.length > 0) {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];
        let hit = false;

        for (let j = 0; j < this.bosses.length; j++) {
          const boss = this.bosses[j];
          if (this.rectCollision(bullet, boss)) {
            boss.takeDamage(bullet.damage);
            hit = true;
            AudioManager.playSound('hit');
            break;
          }
        }

        if (hit && bullet.type !== 'laser') {
          this.bullets.splice(i, 1);
        }
      }
    } else if (this.boss) {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];

        if (this.rectCollision(bullet, this.boss)) {
          this.boss.takeDamage(bullet.damage);

          if (bullet.type !== 'laser') {
            this.bullets.splice(i, 1);
          }

          AudioManager.playSound('hit');
        }
      }
    }

    if (this.player && !this.player.invulnerable) {
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = this.enemyBullets[i];

        if (this.rectCollision(bullet, this.player)) {
          this.player.takeDamage(bullet.damage);
          this.enemyBullets.splice(i, 1);

          this.screenShake += 20;

          this.damagePopups.push(new DamagePopup(
            this.player.x + this.player.width / 2,
            this.player.y,
            bullet.damage
          ));

          if (this.player.hp <= 0) {
            this.gameOver();
          }

          AudioManager.playSound('hit');
        }
      }
    }

    if (this.player && !this.player.invulnerable) {
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];

        if (this.rectCollision(enemy, this.player)) {
          this.player.takeDamage(30);
          enemy.takeDamage(999);
          this.destroyEnemy(enemy, j);

          this.screenShake += 35;

          this.damagePopups.push(new DamagePopup(
            this.player.x + this.player.width / 2,
            this.player.y,
            30
          ));

          if (this.player.hp <= 0) {
            this.gameOver();
          }

          AudioManager.playSound('explosion', 0.2);
        }
      }
    }

    if (this.player) {
      for (let i = this.coins.length - 1; i >= 0; i--) {
        const coin = this.coins[i];

        if (this.rectCollision(coin, this.player)) {
          Storage.addCoins(coin.value);
          this.coins.splice(i, 1);
          AudioManager.playSound('coinCollect');
        }
      }

      for (let i = this.healthBonuses.length - 1; i >= 0; i--) {
        const bonus = this.healthBonuses[i];

        if (this.rectCollision(bonus, this.player)) {
          this.player.hp = Math.min(this.player.hp + bonus.healthRestore, this.player.maxHp);
          this.healthBonuses.splice(i, 1);
          AudioManager.playSound('powerup');
        }
      }
    }
  },

  rectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  },

  separateEntities(entities) {
    if (!entities || entities.length < 2) return;

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const a = entities[i];
        const b = entities[j];

        if (a.entering || b.entering) continue;

        if (this.rectCollision(a, b)) {
          const overlapX = Math.min(
            a.x + a.width - b.x,
            b.x + b.width - a.x
          );
          const overlapY = Math.min(
            a.y + a.height - b.y,
            b.y + b.height - a.y
          );

          if (overlapX < overlapY) {
            const pushAmount = overlapX / 2 + 2;
            if (a.x < b.x) {
              a.x -= pushAmount;
              b.x += pushAmount;
            } else {
              a.x += pushAmount;
              b.x -= pushAmount;
            }
          } else {
            const pushAmount = overlapY / 2 + 2;
            if (a.y < b.y) {
              a.y -= pushAmount;
              b.y += pushAmount;
            } else {
              a.y += pushAmount;
              b.y -= pushAmount;
            }
          }
        }
      }
    }
  },

  destroyEnemy(enemy, index) {
    this.enemies.splice(index, 1);

    this.enemiesDestroyed++;
    this.killStreak++;
    this.streakTimer = 3;

    this.combo = Math.min(5.0, 1.0 + this.killStreak * 0.1);

    const points = Math.floor(ENEMY_PROPS[enemy.type].score * this.combo * (this.scoreMultiplier || 1));
    this.score += points;

    const coinValue = Math.floor(10 * this.combo);
    this.coins.push(new Coin(enemy.x, enemy.y, coinValue));

    const healthDropChance = 0.15 * (this.dropRateMultiplier || 1);
    if (Math.random() < healthDropChance) {
      this.healthBonuses.push(new HealthBonus(enemy.x, enemy.y));
    }

    this.createExplosion(enemy.x, enemy.y, ENEMY_PROPS[enemy.type].color);

    Storage.addBricks(1);

    AudioManager.playSound('explosion', 0.2);

    this.screenShake += 8;
  },

  defeatChallengeBoss(boss, index) {
    this.bossesDefeated++;
    this.score += Math.floor(5000 * (this.scoreMultiplier || 1));

    this.bosses.splice(index, 1);

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const dist = 40;
      const x = boss.x + Math.cos(angle) * dist;
      const y = boss.y + Math.sin(angle) * dist;
      this.coins.push(new Coin(x, y, 50));
    }

    this.healthBonuses.push(new HealthBonus(boss.x, boss.y));

    this.createExplosion(boss.x, boss.y, '#ff0000', 40);

    AudioManager.playSound('bossDeath');

    this.screenShake += 10;

    if (this.bosses.length === 0) {
      this.state = 'playing';
      this.nextWave();
    }
  },

  defeatBoss() {
    this.bossesDefeated++;
    this.score += Math.floor(5000 * (this.scoreMultiplier || 1));

    for (let i = 0; i < 15; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const dist = 80;
      const x = this.boss.x + Math.cos(angle) * dist;
      const y = this.boss.y + Math.sin(angle) * dist;

      this.coins.push(new Coin(x, y, 100));
    }

    let healthBonusCount;
    const roll = Math.random();
    if (roll < 0.01) healthBonusCount = 5;
    else if (roll < 0.06) healthBonusCount = 4;
    else if (roll < 0.21) healthBonusCount = 3;
    else if (roll < 0.51) healthBonusCount = 2;
    else healthBonusCount = 1;

    for (let i = 0; i < healthBonusCount; i++) {
      const angle = (i / healthBonusCount) * Math.PI * 2 + Math.PI / 2;
      const dist = 60;
      const x = this.boss.x + this.boss.width / 2 + Math.cos(angle) * dist;
      const y = this.boss.y + this.boss.height / 2 + Math.sin(angle) * dist;

      this.healthBonuses.push(new HealthBonus(x, y));
    }

    this.createExplosion(this.boss.x, this.boss.y, '#ff0000', 80);

    Storage.addBossDefeated(this.boss.bossNumber);

    AudioManager.playSound('bossDeath');

    this.screenShake += 20;

    this.boss = null;
    this.state = 'playing';

    this.nextWave();
  },

  collectPowerup(powerup) {
    const props = POWERUP_PROPS[powerup.type];

    this.activePowerups.push({
      type: props.name.toLowerCase().replace(/ /g, '_'),
      props: props,
      timer: props.duration,
    });

    AudioManager.playSound('powerup');
  },

  updateActivePowerups(dt) {
    this.activePowerups = this.activePowerups.filter(powerup => {
      powerup.timer -= dt * 1000;
      return powerup.timer > 0;
    });
  },

  createExplosion(x, y, color, count = 30) {
    const MAX_PARTICLES = 300;

    if (!this.shockwaves) this.shockwaves = [];
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: count * 2,
      life: 0.5,
      color: color
    });

    this.explosionFlash = { x: x, y: y, life: 0.1, radius: count * 3 };

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;

      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 100 + Math.random() * 200;

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0 + Math.random() * 0.5,
        color: color,
        size: 3 + Math.random() * 6,
        glow: true,
        update(dt) {
          this.x += this.vx * dt;
          this.y += this.vy * dt;
          this.life -= dt * 1.2;
          this.vy += 200 * dt;
          this.vx *= 0.98;
        }
      });
    }
  },

  nextWave() {
    if (this.mode === 'timeattack' && this.modeTimer > 0) {
      const timeBonus = Math.max(0, Math.floor((60 - this.modeTimer) * 100));
      if (timeBonus > 0) {
        this.score += timeBonus;
        this.damagePopups.push({
          x: CONFIG.WIDTH / 2,
          y: CONFIG.HEIGHT / 3,
          text: `TIME BONUS +${timeBonus}`,
          life: 2.0,
          vy: -60,
          alpha: 1.0,
          update(dt) {
            this.y += this.vy * dt;
            this.life -= dt;
            this.alpha = Math.max(0, this.life / 2);
          },
          draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.font = 'bold 32px Arial';
            ctx.fillStyle = '#38bdf8';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(this.text, this.x, this.y);
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
          },
          isDead() {
            return this.life <= 0;
          }
        });
      }
      this.modeTimer = 0;
    }

    if (this.mode === 'bossrush' && this.bossesDefeated >= 5) {
      this.bossRushVictory();
      return;
    }

    this.wave++;
    this.waveCompleteTimer = 0;
    this.startWave();
  },

  pause() {
    if (this.state === 'playing' || this.state === 'boss') {
      this.state = 'paused';
      this.keys = {};
      this.isShooting = false;
      if (this.player) this.player.resetMovement();
      UI.showPause();
      AudioManager.pauseMusic();
    }
  },

  resume() {
    this.state = this.boss ? 'boss' : 'playing';
    AudioManager.playMusic();
  },

  bossRushVictory() {
    this.state = 'victory';
    this.cleanup();

    if (this.score > Storage.getHighScore()) {
      Storage.setHighScore(this.score);
    }

    UI.showBossRushVictory(this);

    AudioManager.pauseMusic();
    AudioManager.playSound('powerup');
  },

  gameOver() {
    this.combo = 1.0;
    this.killStreak = 0;

    if (this.hasRevive && !this.reviveUsed) {
      this.reviveUsed = true;
      this.player.hp = this.player.maxHp;
      this.player.shields = this.player.maxShields || 0;
      this.player.invulnerable = true;
      this.player.invulnerableTimer = 3;
      AudioManager.playSound('powerup');
      return;
    }

    this.state = 'gameover';
    this.cleanup();

    if (this.score > Storage.getHighScore()) {
      Storage.setHighScore(this.score);
    }

    UI.showGameOver(this);

    AudioManager.pauseMusic();
    AudioManager.playSound('gameover');
  },

  render() {
    this.ctx.fillStyle = '#0a0e27';
    this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    this.ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(shakeX, shakeY);
    }

    Background.draw(this.ctx);

    if (this.state === 'playing' || this.state === 'boss' || this.state === 'paused') {
      this.coins.forEach(coin => coin.draw(this.ctx));

      this.healthBonuses.forEach(bonus => bonus.draw(this.ctx));

      this.bullets.forEach(bullet => bullet.draw(this.ctx));

      this.enemyBullets.forEach(bullet => bullet.draw(this.ctx));

      this.enemies.forEach(enemy => enemy.draw(this.ctx));

      if (this.bosses && this.bosses.length > 0) {
        this.bosses.forEach(boss => boss.draw(this.ctx));
      } else if (this.boss) {
        this.boss.draw(this.ctx);
      }

      if (this.player) {
        this.player.draw(this.ctx);
      }

      this.particles.forEach(particle => {
        this.ctx.fillStyle = particle.color;
        this.ctx.globalAlpha = particle.life;
        this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      });
      this.ctx.globalAlpha = 1;

      this.damagePopups.forEach(popup => popup.draw(this.ctx));

      if (this.state === 'playing' || this.state === 'boss') {
        const gradient1 = this.ctx.createLinearGradient(0, 62, CONFIG.WIDTH, 62);
        gradient1.addColorStop(0, 'rgba(56, 189, 248, 0)');
        gradient1.addColorStop(0.5, 'rgba(56, 189, 248, 0.8)');
        gradient1.addColorStop(1, 'rgba(56, 189, 248, 0)');
        this.ctx.fillStyle = gradient1;
        this.ctx.fillRect(0, 62, CONFIG.WIDTH, 2);

        const pulseTime = Date.now() / 1000;
        const pulse = Math.sin(pulseTime * 2) * 0.3 + 0.7;

        this.ctx.strokeStyle = `rgba(56, 189, 248, ${pulse})`;
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        this.ctx.moveTo(10, 70);
        this.ctx.lineTo(10, 90);
        this.ctx.moveTo(10, 70);
        this.ctx.lineTo(30, 70);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(CONFIG.WIDTH - 10, 70);
        this.ctx.lineTo(CONFIG.WIDTH - 10, 90);
        this.ctx.moveTo(CONFIG.WIDTH - 10, 70);
        this.ctx.lineTo(CONFIG.WIDTH - 30, 70);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(10, CONFIG.HEIGHT - 70);
        this.ctx.lineTo(10, CONFIG.HEIGHT - 90);
        this.ctx.moveTo(10, CONFIG.HEIGHT - 70);
        this.ctx.lineTo(30, CONFIG.HEIGHT - 70);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(CONFIG.WIDTH - 10, CONFIG.HEIGHT - 70);
        this.ctx.lineTo(CONFIG.WIDTH - 10, CONFIG.HEIGHT - 90);
        this.ctx.moveTo(CONFIG.WIDTH - 10, CONFIG.HEIGHT - 70);
        this.ctx.lineTo(CONFIG.WIDTH - 30, CONFIG.HEIGHT - 70);
        this.ctx.stroke();

        const scanY = ((pulseTime * 50) % CONFIG.HEIGHT);
        this.ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 * pulse})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, scanY);
        this.ctx.lineTo(CONFIG.WIDTH, scanY);
        this.ctx.stroke();

        const vignetteGradient = this.ctx.createRadialGradient(
          CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.HEIGHT * 0.3,
          CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.HEIGHT * 0.7
        );
        vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        this.ctx.fillStyle = vignetteGradient;
        this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        if (this.state === 'boss' && this.boss && this.boss.entering) {
          const flashAlpha = Math.sin(pulseTime * 10) * 0.15 + 0.15;
          this.ctx.fillStyle = `rgba(239, 68, 68, ${flashAlpha})`;
          this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

          this.ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 3})`;
          this.ctx.font = 'bold 48px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = '#ef4444';
          this.ctx.fillText('BOSS INCOMING', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2);
          this.ctx.shadowBlur = 0;
        }

        const scanlineCount = 40;
        const scanlineSpeed = pulseTime * 30;
        for (let i = 0; i < scanlineCount; i++) {
          const y = (i * (CONFIG.HEIGHT / scanlineCount) + scanlineSpeed) % CONFIG.HEIGHT;
          this.ctx.strokeStyle = `rgba(56, 189, 248, 0.03)`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(0, y);
          this.ctx.lineTo(CONFIG.WIDTH, y);
          this.ctx.stroke();
        }

        const gridSpacing = 50;
        for (let x = 0; x < CONFIG.WIDTH; x += gridSpacing) {
          const offset = (pulseTime * 10) % gridSpacing;
          const gridX = x + offset;
          this.ctx.strokeStyle = `rgba(56, 189, 248, 0.05)`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(gridX, 0);
          this.ctx.lineTo(gridX, CONFIG.HEIGHT);
          this.ctx.stroke();
        }

        const beamPos = (pulseTime * 80) % (CONFIG.WIDTH + CONFIG.HEIGHT);
        const beamGradient = this.ctx.createLinearGradient(
          beamPos - 100, 0,
          beamPos + 100, CONFIG.HEIGHT
        );
        beamGradient.addColorStop(0, 'rgba(56, 189, 248, 0)');
        beamGradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.15)');
        beamGradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
        this.ctx.fillStyle = beamGradient;
        this.ctx.fillRect(beamPos - 100, 0, 200, CONFIG.HEIGHT);

        const bracketSize = 40;
        const bracketThickness = 4;

        for (let layer = 0; layer < 3; layer++) {
          const offset = layer * 8;
          const alpha = pulse * (1 - layer * 0.3);
          this.ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          this.ctx.lineWidth = bracketThickness - layer;

          this.ctx.beginPath();
          this.ctx.moveTo(10 + offset, 70 + offset + bracketSize);
          this.ctx.lineTo(10 + offset, 70 + offset);
          this.ctx.lineTo(10 + offset + bracketSize, 70 + offset);
          this.ctx.stroke();
        }

        for (let layer = 0; layer < 3; layer++) {
          const offset = layer * 8;
          const alpha = pulse * (1 - layer * 0.3);
          this.ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          this.ctx.lineWidth = bracketThickness - layer;

          this.ctx.beginPath();
          this.ctx.moveTo(CONFIG.WIDTH - 10 - offset, 70 + offset + bracketSize);
          this.ctx.lineTo(CONFIG.WIDTH - 10 - offset, 70 + offset);
          this.ctx.lineTo(CONFIG.WIDTH - 10 - offset - bracketSize, 70 + offset);
          this.ctx.stroke();
        }

        for (let layer = 0; layer < 3; layer++) {
          const offset = layer * 8;
          const alpha = pulse * (1 - layer * 0.3);
          this.ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          this.ctx.lineWidth = bracketThickness - layer;

          this.ctx.beginPath();
          this.ctx.moveTo(10 + offset, CONFIG.HEIGHT - 70 - offset - bracketSize);
          this.ctx.lineTo(10 + offset, CONFIG.HEIGHT - 70 - offset);
          this.ctx.lineTo(10 + offset + bracketSize, CONFIG.HEIGHT - 70 - offset);
          this.ctx.stroke();
        }

        for (let layer = 0; layer < 3; layer++) {
          const offset = layer * 8;
          const alpha = pulse * (1 - layer * 0.3);
          this.ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          this.ctx.lineWidth = bracketThickness - layer;

          this.ctx.beginPath();
          this.ctx.moveTo(CONFIG.WIDTH - 10 - offset, CONFIG.HEIGHT - 70 - offset - bracketSize);
          this.ctx.lineTo(CONFIG.WIDTH - 10 - offset, CONFIG.HEIGHT - 70 - offset);
          this.ctx.lineTo(CONFIG.WIDTH - 10 - offset - bracketSize, CONFIG.HEIGHT - 70 - offset);
          this.ctx.stroke();
        }

        const hudPanels = [
          { x: 5, y: 5, w: 200, h: 50 },
          { x: CONFIG.WIDTH - 205, y: 5, w: 200, h: 50 },
        ];

        hudPanels.forEach(panel => {
          this.ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 * pulse})`;
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

          this.ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 * pulse})`;
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(panel.x + 3, panel.y + 3, panel.w - 6, panel.h - 6);

          [
            [panel.x, panel.y],
            [panel.x + panel.w, panel.y],
            [panel.x, panel.y + panel.h],
            [panel.x + panel.w, panel.y + panel.h]
          ].forEach(([cx, cy]) => {
            this.ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            this.ctx.fill();
          });
        });

        const panelLines = [
          { x: 10, y: CONFIG.HEIGHT / 3, length: 60 },
          { x: 10, y: CONFIG.HEIGHT * 2/3, length: 80 },
          { x: CONFIG.WIDTH - 70, y: CONFIG.HEIGHT / 3, length: 60 },
          { x: CONFIG.WIDTH - 90, y: CONFIG.HEIGHT * 2/3, length: 80 },
        ];

        panelLines.forEach((line, i) => {
          const offset = Math.sin(pulseTime * 2 + i) * 5;
          this.ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 + Math.sin(pulseTime * 3 + i) * 0.3})`;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(line.x, line.y + offset);
          this.ctx.lineTo(line.x + (i % 2 === 0 ? line.length : -line.length), line.y + offset);
          this.ctx.stroke();
        });

        if (Math.random() < 0.05) {
          const distortY = Math.random() * CONFIG.HEIGHT;
          const distortHeight = 2 + Math.random() * 4;
          this.ctx.save();
          this.ctx.globalCompositeOperation = 'lighter';
          this.ctx.globalAlpha = 0.5;
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.fillRect(0, distortY, CONFIG.WIDTH, distortHeight);
          this.ctx.restore();
        }

        if (this.glitchEffect && this.glitchEffect.active) {
          this.ctx.save();
          this.ctx.globalCompositeOperation = 'screen';
          this.ctx.globalAlpha = 0.3;
          this.ctx.drawImage(this.canvas, this.glitchEffect.offset, 0);
          this.ctx.drawImage(this.canvas, -this.glitchEffect.offset, 0);
          this.ctx.restore();
        }

        this.uiParticles.forEach(p => {
          const alpha = (p.life / p.maxLife) * p.alpha;
          this.ctx.fillStyle = p.color;
          this.ctx.globalAlpha = alpha;
          this.ctx.fillRect(p.x, p.y, p.size, p.size);

          this.ctx.shadowBlur = 5;
          this.ctx.shadowColor = p.color;
          this.ctx.fillRect(p.x, p.y, p.size, p.size);
          this.ctx.shadowBlur = 0;
        });
        this.ctx.globalAlpha = 1;

        this.energyStreams.forEach(s => {
          if (s.life > 0) {
            const grad = this.ctx.createLinearGradient(s.x, 0, s.x + s.width, 0);
            grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
            grad.addColorStop(0.5, `rgba(56, 189, 248, ${s.life * 0.3})`);
            grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(s.x, s.y, s.width, 2);
          }
        });

        if (this.shockwaves) {
          this.shockwaves.forEach(wave => {
            this.ctx.save();
            this.ctx.strokeStyle = wave.color;
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = wave.life / 0.5;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = wave.color;
            this.ctx.beginPath();
            this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
          });
        }

        if (this.explosionFlash && this.explosionFlash.life > 0) {
          const flashGrad = this.ctx.createRadialGradient(
            this.explosionFlash.x, this.explosionFlash.y, 0,
            this.explosionFlash.x, this.explosionFlash.y, this.explosionFlash.radius
          );
          flashGrad.addColorStop(0, `rgba(255, 255, 255, ${this.explosionFlash.life})`);
          flashGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          this.ctx.fillStyle = flashGrad;
          this.ctx.fillRect(
            this.explosionFlash.x - this.explosionFlash.radius,
            this.explosionFlash.y - this.explosionFlash.radius,
            this.explosionFlash.radius * 2,
            this.explosionFlash.radius * 2
          );
        }
      }

      if (this.state === 'boss' || this.screenShake > 25) {
        const intensity = Math.min(this.screenShake / 50, 0.3);

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';

        this.ctx.globalAlpha = intensity;
        this.ctx.fillStyle = 'rgba(255, 0, 0, 1)';
        this.ctx.drawImage(this.canvas, 3, 0);

        this.ctx.fillStyle = 'rgba(0, 0, 255, 1)';
        this.ctx.drawImage(this.canvas, -3, 0);

        this.ctx.restore();
      }
    }

    this.ctx.restore();
  }
};
