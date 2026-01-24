const AssetLoader = {
  images: {},
  sounds: {},
  loaded: false,
  totalAssets: 0,
  loadedAssets: 0,
  onProgressCallback: null,
  onCompleteCallback: null,

  manifest: {
    player: {
      ship1_blue: 'breakout_assets/playerShip1_blue.png',
      ship1_green: 'breakout_assets/playerShip1_green.png',
      ship1_orange: 'breakout_assets/playerShip1_orange.png',
      ship1_red: 'breakout_assets/playerShip1_red.png',
      ship2_blue: 'breakout_assets/playerShip2_blue.png',
      ship2_green: 'breakout_assets/playerShip2_green.png',
      ship2_orange: 'breakout_assets/playerShip2_orange.png',
      ship2_red: 'breakout_assets/playerShip2_red.png',
      ship3_blue: 'breakout_assets/playerShip3_blue.png',
      ship3_green: 'breakout_assets/playerShip3_green.png',
      ship3_orange: 'breakout_assets/playerShip3_orange.png',
      ship3_red: 'breakout_assets/playerShip3_red.png',
    },

    enemies: {
      scout: 'breakout_assets/Enemies/enemyBlack1.png',

      fighter: 'breakout_assets/Enemies/enemyBlue1.png',

      interceptor: 'breakout_assets/Enemies/enemyGreen1.png',

      heavy: 'breakout_assets/Enemies/enemyRed1.png',

      bomber: 'breakout_assets/Enemies/enemyBlack2.png',

      gunship: 'breakout_assets/Enemies/enemyBlue2.png',

      elite: 'breakout_assets/Enemies/enemyGreen2.png',

      kamikaze: 'breakout_assets/Enemies/enemyRed2.png',

      splitter: 'breakout_assets/Enemies/enemyBlack3.png',

      shielded: 'breakout_assets/Enemies/enemyBlue3.png',

      dodger: 'breakout_assets/Enemies/enemyGreen3.png',

      spawner: 'breakout_assets/Enemies/enemyRed3.png',

      teleporter: 'breakout_assets/Enemies/enemyBlack4.png',

      armored: 'breakout_assets/Enemies/enemyRed4.png',

      minion: 'breakout_assets/Enemies/enemyBlack5.png',
    },

    bosses: {
      boss1: 'breakout_assets/ufoBlue.png',
      boss2: 'breakout_assets/ufoGreen.png',
      boss3: 'breakout_assets/ufoRed.png',
      boss4: 'breakout_assets/ufoYellow.png',
      boss5: 'breakout_assets/ufoBlue.png',
    },

    bullets: {
      player_normal: 'breakout_assets/Lasers/laserBlue01.png',
      player_laser: 'breakout_assets/Lasers/laserBlue08.png',
      player_homing: 'breakout_assets/Lasers/laserBlue10.png',
      player_wave: 'breakout_assets/Lasers/laserBlue16.png',

      enemy_normal: 'breakout_assets/Lasers/laserRed01.png',
      enemy_fast: 'breakout_assets/Lasers/laserRed03.png',
      enemy_heavy: 'breakout_assets/Lasers/laserRed09.png',

      boss_bullet: 'breakout_assets/Lasers/laserGreen11.png',
      boss_missile: 'breakout_assets/Lasers/laserGreen13.png',
    },

    powerups: {
      spread_shot: 'breakout_assets/Power-ups/powerupBlue_bolt.png',
      rapid_fire: 'breakout_assets/Power-ups/powerupGreen_bolt.png',
      laser_beam: 'breakout_assets/Power-ups/powerupRed_bolt.png',
      homing_missiles: 'breakout_assets/Power-ups/powerupYellow_bolt.png',
      pierce_shot: 'breakout_assets/Power-ups/bolt_gold.png',
      triple_shot: 'breakout_assets/Power-ups/powerupBlue_star.png',
      wave_beam: 'breakout_assets/Power-ups/powerupGreen_star.png',

      shield: 'breakout_assets/Power-ups/powerupBlue_shield.png',
      force_field: 'breakout_assets/Power-ups/shield_gold.png',
      invincibility: 'breakout_assets/Power-ups/shield_bronze.png',

      time_slow: 'breakout_assets/Power-ups/powerupYellow.png',
      screen_clear: 'breakout_assets/Power-ups/powerupRed.png',
      magnet: 'breakout_assets/Power-ups/star_gold.png',
      double_score: 'breakout_assets/Power-ups/star_bronze.png',
      coin_rain: 'breakout_assets/Power-ups/things_gold.png',

      extra_life: 'breakout_assets/Power-ups/pill_green.png',
      repair: 'breakout_assets/Power-ups/pill_red.png',
      speed_boost: 'breakout_assets/Power-ups/pill_blue.png',
      nuke: 'breakout_assets/Power-ups/things_bronze.png',
      mystery: 'breakout_assets/Power-ups/powerupYellow_star.png',
    },

    ui: {
    }
  },

  soundManifest: {
    sfx: {
      playerShoot: 'breakout_assets/mixkit-short-laser-gun-shot-1670.wav',
      enemyShoot: 'breakout_assets/mixkit-short-laser-gun-shot-1670.wav',
      explosion: 'breakout_assets/mixkit-arcade-space-shooter-dead-notification-272.wav',
      hit: 'breakout_assets/mixkit-falling-hit-757.wav',
      thrust: 'breakout_assets/thrust.mp3',
      powerup: 'breakout_assets/mixkit-falling-hit-757.wav',
      bossDeath: 'breakout_assets/mixkit-arcade-space-shooter-dead-notification-272.wav',
      shieldHit: 'breakout_assets/mixkit-falling-hit-757.wav',
      coinCollect: 'breakout_assets/mixkit-falling-hit-757.wav',
      bossEnter: 'breakout_assets/mixkit-arcade-space-shooter-dead-notification-272.wav',
      gameover: 'breakout_assets/mixkit-arcade-space-shooter-dead-notification-272.wav',
    },
    music: {
      menu: null,
      gameplay: null,
      boss: null,
    }
  },

  init(onProgress, onComplete) {
    this.onProgressCallback = onProgress;
    this.onCompleteCallback = onComplete;
    this.loadAllImages();
  },

  loadAllImages() {
    const imagesToLoad = [];

    Object.keys(this.manifest).forEach(category => {
      Object.keys(this.manifest[category]).forEach(name => {
        imagesToLoad.push({
          category,
          name,
          path: this.manifest[category][name]
        });
      });
    });

    this.totalAssets = imagesToLoad.length;
    this.loadedAssets = 0;

    imagesToLoad.forEach(({category, name, path}) => {
      this.loadImage(category, name, path);
    });

    if (this.totalAssets === 0) {
      this.loaded = true;
      if (this.onCompleteCallback) this.onCompleteCallback();
    }
  },

  loadImage(category, name, path) {
    const img = new Image();

    img.onload = () => {
      if (!this.images[category]) {
        this.images[category] = {};
      }
      this.images[category][name] = img;

      this.loadedAssets++;

      if (this.onProgressCallback) {
        this.onProgressCallback(this.loadedAssets, this.totalAssets);
      }

      if (this.loadedAssets >= this.totalAssets) {
        this.loaded = true;
        if (this.onCompleteCallback) {
          this.onCompleteCallback();
        }
      }
    };

    img.onerror = () => {
      console.warn(`Failed to load image: ${path}`);
      this.loadedAssets++;

      if (this.loadedAssets >= this.totalAssets) {
        this.loaded = true;
        if (this.onCompleteCallback) {
          this.onCompleteCallback();
        }
      }
    };

    img.src = path;
  },

  getPlayerShip(shipType = 'ship1', color = 'blue') {
    const key = `${shipType}_${color}`;
    return this.images.player?.[key] || null;
  },

  getEnemy(type) {
    const typeMap = {
      0: 'scout',
      1: 'fighter',
      2: 'interceptor',
      3: 'heavy',
      4: 'bomber',
      5: 'gunship',
      6: 'elite',
      7: 'kamikaze',
      8: 'splitter',
      9: 'shielded',
      10: 'dodger',
      11: 'spawner',
      12: 'teleporter',
      13: 'armored',
      14: 'minion',
    };

    const key = typeMap[type] || 'scout';
    return this.images.enemies?.[key] || null;
  },

  getBoss(bossNumber) {
    const key = `boss${bossNumber}`;
    return this.images.bosses?.[key] || null;
  },

  getBullet(bulletType, isEnemy = false) {
    if (isEnemy) {
      const enemyTypes = {
        'normal': 'enemy_normal',
        'fast': 'enemy_fast',
        'heavy': 'enemy_heavy',
      };
      return this.images.bullets?.[enemyTypes[bulletType] || 'enemy_normal'] || null;
    } else {
      const playerTypes = {
        'normal': 'player_normal',
        'laser': 'player_laser',
        'homing': 'player_homing',
        'wave': 'player_wave',
      };
      return this.images.bullets?.[playerTypes[bulletType] || 'player_normal'] || null;
    }
  },

  getBossBullet(bulletType = 'bullet') {
    const key = `boss_${bulletType}`;
    return this.images.bullets?.[key] || null;
  },

  getPowerup(powerupType) {
    const typeMap = {
      0: 'spread_shot',
      1: 'rapid_fire',
      2: 'laser_beam',
      3: 'homing_missiles',
      4: 'pierce_shot',
      5: 'triple_shot',
      6: 'wave_beam',
      7: 'shield',
      8: 'force_field',
      9: 'invincibility',
      10: 'time_slow',
      11: 'screen_clear',
      12: 'magnet',
      13: 'double_score',
      14: 'coin_rain',
      15: 'extra_life',
      16: 'repair',
      17: 'speed_boost',
      18: 'nuke',
      19: 'mystery',
    };

    const key = typeMap[powerupType] || 'mystery';
    return this.images.powerups?.[key] || null;
  },

  isLoaded() {
    return this.loaded;
  },

  getProgress() {
    if (this.totalAssets === 0) return 1;
    return this.loadedAssets / this.totalAssets;
  }
};
