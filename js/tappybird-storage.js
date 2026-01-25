
const TappyStorage = {
  KEYS: {
    HIGH_SCORE: 'tb_high_score',
    TOTAL_GAMES: 'tb_total_games',
    TOTAL_SCORE: 'tb_total_score',
    SETTINGS: 'tb_settings',
  },

  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (!value) return defaultValue;
      return JSON.parse(value);
    } catch (e) {
      console.warn(`Storage get error for ${key}:`, e);
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

  getHighScore() {
    return this.get(this.KEYS.HIGH_SCORE, 0);
  },

  setHighScore(score) {
    const current = this.getHighScore();
    if (score > current) {
      this.set(this.KEYS.HIGH_SCORE, score);
      return true;
    }
    return false;
  },

  getTotalGames() {
    return this.get(this.KEYS.TOTAL_GAMES, 0);
  },

  incrementGames() {
    const total = this.getTotalGames() + 1;
    this.set(this.KEYS.TOTAL_GAMES, total);
    return total;
  },

  getTotalScore() {
    return this.get(this.KEYS.TOTAL_SCORE, 0);
  },

  addToTotalScore(score) {
    const total = this.getTotalScore() + score;
    this.set(this.KEYS.TOTAL_SCORE, total);
    return total;
  },

  getSettings() {
    return this.get(this.KEYS.SETTINGS, {
      musicVolume: 0.5,
      sfxVolume: 0.7,
    });
  },

  setSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.set(this.KEYS.SETTINGS, settings);
  },

  resetAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
