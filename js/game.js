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
  activePowerups: [],

  score: 0,
  wave: 1,
  combo: 1.0,
  comboTimer: 0,
  killStreak: 0,
  enemiesDestroyed: 0,
  coinsEarned: 0,

  enemySpawnTimer: 0,
  enemiesThisWave: 0,
  enemiesSpawnedThisWave: 0,
  waveCompleteTimer: 0,

  lastTime: 0,
  deltaTime: 0,

  keys: {},
  mouseX: null,
  mouseY: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.setupInput();

    AudioManager.init();
    BackgroundEffects.init(this.canvas.width, this.canvas.height);

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  },

  resize() {
    const aspectRatio = CONFIG.WIDTH / CONFIG.HEIGHT;
    let width = window.innerWidth;
    let height = window.innerHeight;

    if (width / height > aspectRatio) {
      width = height * aspectRatio;
    } else {
      height = width / aspectRatio;
    }

    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;
    this.canvas.style.width = Math.floor(width) + 'px';
    this.canvas.style.height = Math.floor(height) + 'px';
  },

  setupInput() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (CONFIG.WIDTH / rect.width);
      this.mouseY = (e.clientY - rect.top) * (CONFIG.HEIGHT / rect.height);
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.state === 'playing' || this.state === 'boss') {
        this.keys['Space'] = true;
      }
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.state === 'playing' || this.state === 'boss') {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = (touch.clientX - rect.left) * (CONFIG.WIDTH / rect.width);
        this.keys['Space'] = true;
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (touch.clientX - rect.left) * (CONFIG.WIDTH / rect.width);
      this.mouseY = (touch.clientY - rect.top) * (CONFIG.HEIGHT / rect.height);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.keys['Space'] = false;
    });

    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.key === 'Escape' || e.key === 'p') {
        if (this.state === 'playing' || this.state === 'boss') {
          this.pause();
        } else if (this.state === 'paused') {
          this.resume();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  },

  startGame(mode = 'classic') {
    this.state = 'playing';
    this.mode = mode;
    this.score = 0;
    this.wave = 1;
    this.combo = 1.0;
    this.comboTimer = 0;
    this.killStreak = 0;
    this.enemiesDestroyed = 0;
    this.coinsEarned = 0;
    this.activePowerups = [];

    this.initWave();
    AudioManager.playMusic();
    UI.updateHUD(this);
  },

  initWave() {
    const startX = CONFIG.WIDTH / 2 - CONFIG.PLAYER_WIDTH / 2;
    const startY = CONFIG.HEIGHT - CONFIG.PLAYER_HEIGHT - 50;
    this.player = new Player(startX, startY);

    const upgrades = Storage.getUpgrades();
    if (upgrades.includes('BIGGER_SHIP_1')) {
      this.player.width *= 1.2;
      this.player.height *= 1.2;
      this.player.maxHp += 10;
      this.player.hp += 10;
    }
    if (upgrades.includes('BIGGER_SHIP_2')) {
      this.player.width *= 1.2;
      this.player.height *= 1.2;
      this.player.maxHp += 10;
      this.player.hp += 10;
    }
    if (upgrades.includes('BIGGER_SHIP_3')) {
      this.player.width *= 1.2;
      this.player.height *= 1.2;
      this.player.maxHp += 10;
      this.player.hp += 10;
    }
    if (upgrades.includes('EXTRA_HP_1')) this.player.maxHp += 20;
    if (upgrades.includes('EXTRA_HP_2')) this.player.maxHp += 20;
    if (upgrades.includes('EXTRA_HP_3')) this.player.maxHp += 20;
    if (upgrades.includes('FIRE_RATE')) this.player.fireRate *= 0.5;

    this.player.hp = this.player.maxHp;

    this.bullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.powerups = [];
    this.coins = [];

    this.enemySpawnTimer = 0;
    this.enemiesThisWave = 5 + this.wave * 2;
    this.enemiesSpawnedThisWave = 0;
    this.waveCompleteTimer = 0;

    if (this.wave % CONFIG.BOSS_EVERY_N_WAVES === 0) {
      this.startBossFight();
    }

    ParticleSystem.clear();
  },

  startBossFight() {
    this.state = 'boss';
    const bossNum = Math.min(Math.floor(this.wave / CONFIG.BOSS_EVERY_N_WAVES), 5);
    const config = BOSS_CONFIGS[bossNum];
    this.boss = new Boss(this.wave, config);
    this.enemies = [];
    this.enemyBullets = [];
  },

  gameLoop(currentTime) {
    this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === 'playing' || this.state === 'boss') {
      this.update(this.deltaTime);
    }
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  },

  update(dt) {
    BackgroundEffects.update(dt, CONFIG.WIDTH, CONFIG.HEIGHT);

    ScreenShake.update(dt);

    if (this.player) {
      this.player.update(dt, this.keys, this.mouseX, CONFIG.WIDTH, CONFIG.HEIGHT);

      if (this.keys['Space'] || this.keys['KeyZ']) {
        if (this.player.shoot()) {
          this.createPlayerBullet();
        }
      }
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(dt, this.enemies);

      if (bullet.y < -50 || bullet.x < -50 || bullet.x > CONFIG.WIDTH + 50) {
        this.bullets.splice(i, 1);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player ? this.player.getCenterX() : CONFIG.WIDTH / 2, CONFIG.WIDTH);

      if (enemy.canShoot()) {
        this.createEnemyBullet(enemy);
      }

      if (enemy.y > CONFIG.HEIGHT + 100) {
        this.enemies.splice(i, 1);
        continue;
      }

      if (this.player && Physics.rectRectCollision(enemy.getBounds(), this.player.getBounds())) {
        if (this.player.takeDamage(20)) {
          this.gameOver();
        }
        this.destroyEnemy(enemy, i);
        ScreenShake.shake(10, 300);
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.update(dt);

      if (bullet.y > CONFIG.HEIGHT + 50) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (this.player && Physics.rectRectCollision(bullet.getBounds(), this.player.getBounds())) {
        if (this.player.takeDamage(bullet.damage)) {
          this.gameOver();
        }
        this.enemyBullets.splice(i, 1);
        ScreenShake.shake(5, 200);
      }
    }

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      powerup.update(dt);

      if (this.player && Physics.rectRectCollision(powerup.getBounds(), this.player.getBounds())) {
        this.collectPowerup(powerup);
        this.powerups.splice(i, 1);
        continue;
      }

      if (powerup.y > CONFIG.HEIGHT + 50) {
        this.powerups.splice(i, 1);
      }
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.update(dt);

      if (this.player && Physics.rectRectCollision(coin.getBounds(), this.player.getBounds())) {
        this.collectCoin();
        this.coins.splice(i, 1);
        ParticleSystem.createBurst(coin.x, coin.y, '#fbbf24', 10);
        continue;
      }

      if (coin.y > CONFIG.HEIGHT + 50) {
        this.coins.splice(i, 1);
      }
    }

    for (let i = this.activePowerups.length - 1; i >= 0; i--) {
      const power = this.activePowerups[i];
      power.timer -= dt * 1000;
      if (power.timer <= 0) {
        this.deactivatePowerup(power.type);
        this.activePowerups.splice(i, 1);
      }
    }

    this.checkBulletEnemyCollisions();

    if (this.state === 'boss' && this.boss) {
      this.boss.update(dt, CONFIG.WIDTH, this.player ? this.player.getCenterX() : CONFIG.WIDTH / 2);

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];
        if (Physics.rectRectCollision(bullet.getBounds(), this.boss.getBounds())) {
          if (this.boss.hit(bullet.damage)) {
            this.defeatBoss();
          }
          this.bullets.splice(i, 1);
          AudioManager.playSound('boss');
          ScreenShake.shake(8, 300);
          ParticleSystem.createExplosion(bullet.x, bullet.y, this.boss.config.color, 20);
        }
      }

      for (let i = this.boss.projectiles.length - 1; i >= 0; i--) {
        const proj = this.boss.projectiles[i];
        if (this.player && Physics.rectRectCollision(
          { x: proj.x, y: proj.y, width: proj.width, height: proj.height },
          this.player.getBounds()
        )) {
          if (this.player.takeDamage(15)) {
            this.gameOver();
          }
          this.boss.projectiles.splice(i, 1);
          ScreenShake.shake(10, 300);
        }
      }
    }

    ParticleSystem.update(dt);

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1.0;
        this.killStreak = 0;
        UI.updateHUD(this);
      }
    }

    if (this.state === 'playing') {
      this.enemySpawnTimer += dt * 1000;

      if (this.enemySpawnTimer >= CONFIG.ENEMY_SPAWN_INTERVAL &&
          this.enemiesSpawnedThisWave < this.enemiesThisWave) {
        this.spawnEnemy();
        this.enemySpawnTimer = 0;
      }

      if (this.enemiesSpawnedThisWave >= this.enemiesThisWave && this.enemies.length === 0) {
        this.waveCompleteTimer += dt;
        if (this.waveCompleteTimer >= 2) {
          this.completeWave();
        }
      }
    }

    UI.updateHUD(this);
  },

  createPlayerBullet() {
    const x = this.player.getCenterX();
    const y = this.player.y;

    const hasSpreadShot = this.activePowerups.some(p => p.type === POWERUP_TYPES.SPREAD_SHOT);
    const hasLaser = this.activePowerups.some(p => p.type === POWERUP_TYPES.LASER_BEAM);
    const hasHoming = this.activePowerups.some(p => p.type === POWERUP_TYPES.HOMING);
    const hasTorpedo = this.activePowerups.some(p => p.type === POWERUP_TYPES.TORPEDO);

    if (hasSpreadShot) {
      this.bullets.push(new Bullet(x, y, 'normal'));
      this.bullets.push(new Bullet(x - 20, y, 'normal'));
      this.bullets.push(new Bullet(x + 20, y, 'normal'));
    } else if (hasLaser) {
      this.bullets.push(new Bullet(x, y, 'laser'));
    } else if (hasHoming) {
      this.bullets.push(new Bullet(x, y, 'homing'));
    } else if (hasTorpedo) {
      this.bullets.push(new Bullet(x, y, 'torpedo'));
    } else {
      this.bullets.push(new Bullet(x, y, 'normal'));
    }

    AudioManager.playSound('paddle', 0.1);
  },

  createEnemyBullet(enemy) {
    const x = enemy.getCenterX();
    const y = enemy.y + enemy.height;

    if (enemy.type === ENEMY_TYPES.BOMBER) {
      this.enemyBullets.push(new EnemyBullet(x, y, -50, CONFIG.ENEMY_BULLET_SPEED));
      this.enemyBullets.push(new EnemyBullet(x, y, 0, CONFIG.ENEMY_BULLET_SPEED));
      this.enemyBullets.push(new EnemyBullet(x, y, 50, CONFIG.ENEMY_BULLET_SPEED));
    } else {
      this.enemyBullets.push(new EnemyBullet(x, y));
    }
  },

  spawnEnemy() {
    const types = Object.values(ENEMY_TYPES);

    let type;
    if (this.wave < 3) {
      type = types[Math.floor(Math.random() * 3)];
    } else if (this.wave < 5) {
      type = types[Math.floor(Math.random() * 6)];
    } else {
      type = types[Math.floor(Math.random() * types.length)];
    }

    const x = Math.random() * (CONFIG.WIDTH - 40);
    const y = -40;

    const enemy = new Enemy(x, y, type);

    const patterns = ['straight', 'sine', 'zigzag'];
    if (enemy.type !== ENEMY_TYPES.KAMIKAZE && enemy.type !== ENEMY_TYPES.DODGER) {
      enemy.pattern = patterns[Math.floor(Math.random() * patterns.length)];
    }

    this.enemies.push(enemy);
    this.enemiesSpawnedThisWave++;
  },

  checkBulletEnemyCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      let hit = false;

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (enemy.destroyed) continue;

        if (Physics.rectRectCollision(bullet.getBounds(), enemy.getBounds())) {
          const destroyed = enemy.takeDamage(bullet.damage);

          if (destroyed) {
            this.destroyEnemy(enemy, j);
          }

          hit = true;
          ParticleSystem.createBurst(bullet.x, bullet.y, enemy.props.color, 8);
          break;
        }
      }

      if (hit) {
        this.bullets.splice(i, 1);
      }
    }
  },

  destroyEnemy(enemy, index) {
    enemy.destroyed = true;
    this.enemiesDestroyed++;
    this.killStreak++;
    this.combo = Math.min(this.combo + 0.1, 10.0);
    this.comboTimer = 3;

    const points = Math.floor(enemy.props.score * this.combo);
    this.score += points;

    ParticleSystem.createExplosion(enemy.getCenterX(), enemy.getCenterY(), enemy.props.color, 15);
    ScreenShake.shake(3, 100);

    if (Math.random() < CONFIG.POWERUP_DROP_CHANCE) {
      this.spawnPowerup(enemy.getCenterX(), enemy.getCenterY());
    }

    if (Math.random() < 0.3) {
      this.coins.push(new Coin(enemy.getCenterX(), enemy.getCenterY()));
    }

    if (enemy.type === ENEMY_TYPES.SPLITTER) {
      for (let i = 0; i < 2; i++) {
        const split = new Enemy(enemy.x + i * 20, enemy.y, ENEMY_TYPES.SCOUT);
        split.vx = (i === 0 ? -100 : 100);
        this.enemies.push(split);
      }
    }

    Storage.addBricks(1);
    this.enemies.splice(index, 1);
  },

  spawnPowerup(x, y) {
    const types = Object.values(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push(new PowerUp(x, y, type));
  },

  collectPowerup(powerup) {
    this.activatePowerup(powerup.type);
    AudioManager.playSound('powerup');
    ParticleSystem.createBurst(powerup.x, powerup.y, powerup.props.color, 20);
    Storage.addPowerupCollected(powerup.type);
  },

  activatePowerup(type) {
    const props = POWERUP_PROPS[type];

    if (type === POWERUP_TYPES.BOMB) {
      const count = this.enemies.length;
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        this.destroyEnemy(this.enemies[i], i);
      }
      ScreenShake.shake(15, 500);
      return;
    }

    if (type === POWERUP_TYPES.LIGHTNING) {
      for (let i = 0; i < 5 && this.enemies.length > 0; i++) {
        const enemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
        if (enemy.takeDamage(30)) {
          this.destroyEnemy(enemy, this.enemies.indexOf(enemy));
        }
      }
      ScreenShake.shake(10, 300);
      return;
    }

    if (type === POWERUP_TYPES.EMP) {
      this.enemies.forEach(e => {
        e.speed *= 0.2;
        setTimeout(() => e.speed = ENEMY_PROPS[e.type].speed, 3000);
      });
      return;
    }

    if (type === POWERUP_TYPES.COIN_RAIN) {
      for (let i = 0; i < 20; i++) {
        this.coins.push(new Coin(Math.random() * CONFIG.WIDTH, Math.random() * 200 - 200));
      }
      return;
    }

    if (type === POWERUP_TYPES.SHIELD_UP && this.player) {
      this.player.addShield(50);
      return;
    }

    if (type === POWERUP_TYPES.ENEMY_HEAL) {
      this.enemies.forEach(e => {
        e.hp = Math.min(e.maxHp, e.hp + 10);
      });
      return;
    }

    if (props.duration > 0) {
      this.activePowerups = this.activePowerups.filter(p => p.type !== type);

      this.activePowerups.push({
        type,
        timer: props.duration,
        props,
      });
      UI.updateHUD(this);
    }
  },

  deactivatePowerup(type) {
    UI.updateHUD(this);
  },

  collectCoin() {
    this.coinsEarned++;
    Storage.addCoins(1);
    this.score += 10;
    AudioManager.playSound('powerup', 0.3);
  },

  completeWave() {
    this.wave++;
    this.score += 500;
    ParticleSystem.createBurst(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, '#22c55e', 50);
    ScreenShake.shake(10, 400);
    this.initWave();
  },

  defeatBoss() {
    Storage.addBossDefeated(Math.floor(this.wave / CONFIG.BOSS_EVERY_N_WAVES));
    this.score += 5000;
    this.coinsEarned += 50;
    Storage.addCoins(50);
    ParticleSystem.createBurst(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, this.boss.config.color, 100);
    ScreenShake.shake(20, 800);
    this.boss = null;
    this.state = 'playing';
    this.wave++;
    this.initWave();
  },

  gameOver() {
    this.state = 'gameover';
    Storage.setHighScore(this.score);
    Storage.incrementStat('gamesPlayed');
    AudioManager.pauseMusic();
    UI.showGameOver(this);
  },

  pause() {
    this.state = 'paused';
    AudioManager.pauseMusic();
    UI.showPause();
  },

  resume() {
    this.state = 'playing';
    AudioManager.playMusic();
    UI.hidePause();
  },

  render() {
    const ctx = this.ctx;
    const offset = ScreenShake.getOffset();

    ctx.save();
    ctx.translate(offset.x, offset.y);

    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    BackgroundEffects.draw(ctx, CONFIG.WIDTH, CONFIG.HEIGHT);

    if (this.state === 'playing' || this.state === 'boss' || this.state === 'paused') {
      this.enemies.forEach(enemy => enemy.draw(ctx));

      this.bullets.forEach(bullet => bullet.draw(ctx));
      this.enemyBullets.forEach(bullet => bullet.draw(ctx));

      this.powerups.forEach(powerup => powerup.draw(ctx));
      this.coins.forEach(coin => coin.draw(ctx));

      if (this.player) {
        this.player.draw(ctx);
      }

      if (this.boss) {
        this.boss.draw(ctx);
      }

      if (this.player) {
        this.drawHPBar(ctx);
      }
    }

    ParticleSystem.draw(ctx);

    ctx.restore();
  },

  drawHPBar(ctx) {
    const barWidth = 200;
    const barHeight = 20;
    const barX = 20;
    const barY = CONFIG.HEIGHT - 40;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpRatio = this.player.hp / this.player.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    if (this.player.shields > 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.fillRect(barX, barY - 8, barWidth * (this.player.shields / 100), 6);
    }

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`HP: ${Math.max(0, Math.floor(this.player.hp))}/${this.player.maxHp}`, barX + 5, barY + 15);
  },
};
