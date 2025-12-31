const Storage = {
  KEYS: {
    HIGH_SCORE: 'gb_high_score',
    HIGH_SCORES: 'gb_high_scores',
    BEST_COMBO: 'gb_best_combo',
    TOTAL_BRICKS: 'gb_total_bricks',
    BOSSES_DEFEATED: 'gb_bosses_defeated',
    TOTAL_COINS: 'gb_total_coins',
    ACHIEVEMENTS: 'gb_achievements',
    UPGRADES: 'gb_upgrades',
    SETTINGS: 'gb_settings',
    STATS: 'gb_stats',
    DAILY_SCORE: 'gb_daily_score',
    DAILY_DATE: 'gb_daily_date',
  },

  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (!value) return defaultValue;
      return JSON.parse(value);
    } catch (e) {
      console.warn(`Storage get error for ${key}, clearing corrupted data:`, e);
      localStorage.removeItem(key);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Storage set error for ${key}:`, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`Storage remove error for ${key}:`, e);
      return false;
    }
  },

  getHighScore() {
    return this.get(this.KEYS.HIGH_SCORE, 0);
  },

  setHighScore(score) {
    const current = this.getHighScore();
    if (score > current) {
      this.set(this.KEYS.HIGH_SCORE, score);
      this.addToHighScores(score);
      return true;
    }
    return false;
  },

  getHighScores() {
    return this.get(this.KEYS.HIGH_SCORES, []);
  },

  addToHighScores(score) {
    const scores = this.getHighScores();
    scores.push({
      score,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    });
    scores.sort((a, b) => b.score - a.score);
    this.set(this.KEYS.HIGH_SCORES, scores.slice(0, 10));
  },

  getBestCombo() {
    return this.get(this.KEYS.BEST_COMBO, 1.0);
  },

  setBestCombo(combo) {
    const current = this.getBestCombo();
    if (combo > current) {
      this.set(this.KEYS.BEST_COMBO, combo);
      return true;
    }
    return false;
  },

  getTotalBricks() {
    return this.get(this.KEYS.TOTAL_BRICKS, 0);
  },

  addBricks(count) {
    const total = this.getTotalBricks() + count;
    this.set(this.KEYS.TOTAL_BRICKS, total);
    return total;
  },

  getBossesDefeated() {
    return this.get(this.KEYS.BOSSES_DEFEATED, []);
  },

  addBossDefeated(bossId) {
    const bosses = this.getBossesDefeated();
    if (!bosses.includes(bossId)) {
      bosses.push(bossId);
      this.set(this.KEYS.BOSSES_DEFEATED, bosses);
    }
  },

  getTotalCoins() {
    return this.get(this.KEYS.TOTAL_COINS, 0);
  },

  addCoins(amount) {
    const total = this.getTotalCoins() + amount;
    this.set(this.KEYS.TOTAL_COINS, total);
    return total;
  },

  spendCoins(amount) {
    const total = this.getTotalCoins();
    if (total >= amount) {
      this.set(this.KEYS.TOTAL_COINS, total - amount);
      return true;
    }
    return false;
  },

  getAchievements() {
    return this.get(this.KEYS.ACHIEVEMENTS, []);
  },

  hasAchievement(id) {
    return this.getAchievements().includes(id);
  },

  unlockAchievement(id) {
    const achievements = this.getAchievements();
    if (!achievements.includes(id)) {
      achievements.push(id);
      this.set(this.KEYS.ACHIEVEMENTS, achievements);
      return true;
    }
    return false;
  },

  getUpgrades() {
    return this.get(this.KEYS.UPGRADES, []);
  },

  hasUpgrade(id) {
    return this.getUpgrades().includes(id);
  },

  purchaseUpgrade(id) {
    const upgrades = this.getUpgrades();
    if (!upgrades.includes(id)) {
      upgrades.push(id);
      this.set(this.KEYS.UPGRADES, upgrades);
      return true;
    }
    return false;
  },

  getSettings() {
    return this.get(this.KEYS.SETTINGS, {
      musicVolume: 0.5,
      sfxVolume: 0.7,
      particleQuality: 'high',
      showFPS: false,
    });
  },

  setSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.set(this.KEYS.SETTINGS, settings);
  },

  getStats() {
    return this.get(this.KEYS.STATS, {
      gamesPlayed: 0,
      totalScore: 0,
      totalTime: 0,
      modesPlayed: [],
      powerupsCollected: {},
    });
  },

  updateStats(updates) {
    const stats = this.getStats();
    Object.assign(stats, updates);
    this.set(this.KEYS.STATS, stats);
  },

  addModePlay(mode) {
    const stats = this.getStats();
    if (!stats.modesPlayed.includes(mode)) {
      stats.modesPlayed.push(mode);
      this.set(this.KEYS.STATS, stats);
    }
  },

  addPowerupCollected(type) {
    const stats = this.getStats();
    if (!stats.powerupsCollected[type]) {
      stats.powerupsCollected[type] = 0;
    }
    stats.powerupsCollected[type]++;
    this.set(this.KEYS.STATS, stats);
  },

  getDailyScore() {
    const date = this.get(this.KEYS.DAILY_DATE);
    const today = new Date().toDateString();
    if (date === today) {
      return this.get(this.KEYS.DAILY_SCORE, 0);
    }
    return 0;
  },

  setDailyScore(score) {
    const current = this.getDailyScore();
    const today = new Date().toDateString();
    if (score > current) {
      this.set(this.KEYS.DAILY_SCORE, score);
      this.set(this.KEYS.DAILY_DATE, today);
      return true;
    }
    return false;
  },

  resetAll() {
    if (confirm('Reset all game data? This cannot be undone!')) {
      Object.values(this.KEYS).forEach(key => this.remove(key));
      location.reload();
    }
  },
};
