// UI system - handles all user interface interactions

class GameUI {
  constructor(game) {
    this.game = game;
    this.selectedTowerType = null;
    this.selectedTower = null;

    this.elements = {
      money: document.getElementById('money'),
      lives: document.getElementById('lives'),
      wave: document.getElementById('wave'),
      score: document.getElementById('score'),
      startWaveBtn: document.getElementById('start-wave-btn'),
      startWaveOverlay: document.getElementById('start-wave-overlay'),
      waveTimer: document.getElementById('wave-timer'),
      waveCountdown: document.getElementById('wave-countdown'),
      towerInfo: document.getElementById('tower-info'),
      towerTypeDisplay: document.getElementById('tower-type-display'),
      towerLevelDisplay: document.getElementById('tower-level-display'),
      towerDamageDisplay: document.getElementById('tower-damage-display'),
      towerRangeDisplay: document.getElementById('tower-range-display'),
      upgradeBtn: document.getElementById('upgrade-btn'),
      upgradeCost: document.getElementById('upgrade-cost'),
      sellBtn: document.getElementById('sell-btn'),
      sellValue: document.getElementById('sell-value'),
      menuOverlay: document.getElementById('menu-overlay'),
      resultOverlay: document.getElementById('result-overlay'),
      resultTitle: document.getElementById('result-title'),
      resultMessage: document.getElementById('result-message'),
      waveAnnouncement: document.getElementById('wave-announcement'),
      waveNumber: document.getElementById('wave-number'),
      waveComplete: document.getElementById('wave-complete'),
      waveCompleteClose: document.getElementById('wave-complete-close'),
      pauseBtn: document.getElementById('pause-btn'),
      musicBtn: document.getElementById('music-btn'),
      pauseOverlay: document.getElementById('pause-overlay'),
      volumeSlider: document.getElementById('volume-slider'),
      volumeRange: document.getElementById('volume-range'),
      volumeValue: document.getElementById('volume-value'),
      orientationHint: document.getElementById('orientationHint'),
      dismissOrientation: document.getElementById('dismissOrientation')
    };

    this.waveAnnouncementTimeout = null;
    this.waveCompleteTimeout = null;
    this.volumeSliderVisible = false;
    this.orientationDismissed = false;
    this.setupEventListeners();
    this.setupOrientationHint();
  }

  setupEventListeners() {
    // Tower selection buttons
    const towerBtns = document.querySelectorAll('.tower-btn');
    towerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const towerType = btn.dataset.tower;
        this.selectTowerType(towerType);
      });
    });

    // Start wave button
    this.elements.startWaveBtn.addEventListener('click', () => {
      this.game.startNextWave();
    });

    // Upgrade button
    this.elements.upgradeBtn.addEventListener('click', () => {
      if (this.selectedTower) {
        this.game.upgradeTower(this.selectedTower);
      }
    });

    // Sell button
    this.elements.sellBtn.addEventListener('click', () => {
      if (this.selectedTower) {
        this.game.sellTower(this.selectedTower);
        this.deselectTower();
      }
    });

    // Difficulty selection
    document.getElementById('btn-easy').addEventListener('click', () => {
      this.game.startGame('easy');
      this.elements.menuOverlay.style.display = 'none';
    });

    document.getElementById('btn-hard').addEventListener('click', () => {
      this.game.startGame('hard');
      this.elements.menuOverlay.style.display = 'none';
    });

    document.getElementById('btn-endless-easy').addEventListener('click', () => {
      this.game.startGame('endless-easy');
      this.elements.menuOverlay.style.display = 'none';
    });

    document.getElementById('btn-endless-hard').addEventListener('click', () => {
      this.game.startGame('endless-hard');
      this.elements.menuOverlay.style.display = 'none';
    });

    // Restart/menu buttons
    document.getElementById('btn-restart').addEventListener('click', () => {
      this.elements.resultOverlay.style.display = 'none';
      this.elements.menuOverlay.style.display = 'flex';
    });

    document.getElementById('btn-menu').addEventListener('click', () => {
      this.elements.resultOverlay.style.display = 'none';
      this.elements.menuOverlay.style.display = 'flex';
    });

    // Wave complete close button
    this.elements.waveCompleteClose.addEventListener('click', () => {
      this.elements.waveComplete.classList.add('hidden');
      if (this.waveCompleteTimeout) {
        clearTimeout(this.waveCompleteTimeout);
        this.waveCompleteTimeout = null;
      }
    });

    // Pause button
    this.elements.pauseBtn.addEventListener('click', () => {
      if (this.game.state === 'playing') {
        this.game.pause();
      } else if (this.game.state === 'paused') {
        this.game.resume();
      }
    });

    // Music button - toggle mute and show volume slider
    this.elements.musicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.game.toggleMute();
      this.showVolumeSlider();
    });

    // Volume range slider
    this.elements.volumeRange.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.game.setVolume(value);
      this.elements.volumeValue.textContent = value + '%';

      // Auto-unmute when adjusting volume above 0
      if (value > 0 && this.game.musicMuted) {
        this.game.unmuteMusic();
      }
      // Auto-mute when volume is 0
      if (value === 0 && !this.game.musicMuted) {
        this.game.muteMusic();
      }
    });

    // Prevent slider from closing when clicking on it
    this.elements.volumeSlider.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Close volume slider when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (this.volumeSliderVisible &&
          !this.elements.volumeSlider.contains(e.target) &&
          !this.elements.musicBtn.contains(e.target)) {
        this.hideVolumeSlider();
      }
    });

    // Resume button in pause menu
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.game.resume();
    });

    // Quit button in pause menu
    document.getElementById('btn-quit').addEventListener('click', () => {
      this.game.resume();
      this.game.state = 'menu';
      this.game.stopMusic();
      this.elements.pauseOverlay.style.display = 'none';
      this.elements.menuOverlay.style.display = 'flex';
    });
  }

  selectTowerType(type) {
    this.selectedTowerType = type;
    this.deselectTower();

    // Update button visuals
    document.querySelectorAll('.tower-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.tower === type);
    });
  }

  deselectTowerType() {
    this.selectedTowerType = null;
    document.querySelectorAll('.tower-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
  }

  selectTower(tower) {
    this.selectedTower = tower;
    this.selectedTowerType = null;
    this.deselectTowerType();

    // Show tower info panel
    this.elements.towerInfo.style.display = 'block';
    this.updateTowerInfo();
  }

  deselectTower() {
    this.selectedTower = null;
    this.elements.towerInfo.style.display = 'none';
  }

  updateTowerInfo() {
    if (!this.selectedTower) return;

    const stats = this.selectedTower.getStats();
    const towerStats = TOWER_STATS[this.selectedTower.type];

    this.elements.towerTypeDisplay.textContent = towerStats.name;
    this.elements.towerLevelDisplay.textContent = this.selectedTower.level + 1;
    this.elements.towerDamageDisplay.textContent = stats.damage;
    this.elements.towerRangeDisplay.textContent = Math.floor(stats.range);

    // Update upgrade button
    if (this.selectedTower.canUpgrade()) {
      const cost = this.selectedTower.getUpgradeCost();
      this.elements.upgradeCost.textContent = cost;
      this.elements.upgradeBtn.disabled = this.game.money < cost;
    } else {
      this.elements.upgradeBtn.disabled = true;
      this.elements.upgradeCost.textContent = 'MAX';
    }

    // Update sell button
    const sellValue = this.selectedTower.getSellValue();
    this.elements.sellValue.textContent = sellValue;
  }

  update() {
    // Update resources
    this.elements.money.textContent = this.game.money;
    this.elements.lives.textContent = this.game.lives;
    this.elements.score.textContent = this.game.score;

    // Show wave counter differently for endless mode
    if (this.game.map && this.game.map.endless) {
      this.elements.wave.textContent = `${this.game.currentWave}`;
    } else {
      this.elements.wave.textContent = `${this.game.currentWave}/${WAVES.length}`;
    }

    // Update tower buttons affordability
    document.querySelectorAll('.tower-btn').forEach(btn => {
      const type = btn.dataset.tower;
      const stats = TOWER_STATS[type];
      if (stats) {
        const cost = stats.cost[0];
        btn.disabled = this.game.money < cost;
      }
    });

    // Update tower info if selected
    if (this.selectedTower) {
      this.updateTowerInfo();
    }

    // Update wave button overlay - show only when playing and wave is not in progress
    if (this.game.state !== 'playing' || this.game.waveInProgress) {
      this.elements.startWaveOverlay.classList.add('hidden');
    } else {
      this.elements.startWaveOverlay.classList.remove('hidden');
      // Disable if game is over or all waves complete (but not in endless mode)
      const isEndless = this.game.map && this.game.map.endless;
      this.elements.startWaveBtn.disabled = !isEndless && this.game.currentWave >= WAVES.length;
    }
  }

  showVictory() {
    this.elements.resultTitle.textContent = '🎉 VICTORY! 🎉';
    this.elements.resultMessage.textContent = `You defended the space station!\nFinal Score: ${this.game.score}`;
    this.elements.resultOverlay.style.display = 'flex';
    this.game.stopMusic();
  }

  showDefeat() {
    this.elements.resultTitle.textContent = '💀 DEFEATED 💀';
    this.elements.resultMessage.textContent = `You survived ${this.game.currentWave} waves.\nFinal Score: ${this.game.score}`;
    this.elements.resultOverlay.style.display = 'flex';
    this.game.stopMusic();
  }

  showWaveAnnouncement(waveNum) {
    // Clear any existing timeout
    if (this.waveAnnouncementTimeout) {
      clearTimeout(this.waveAnnouncementTimeout);
    }

    // Update wave number and show
    this.elements.waveNumber.textContent = waveNum;
    this.elements.waveAnnouncement.classList.remove('hidden');

    // Hide after 2.5 seconds
    this.waveAnnouncementTimeout = setTimeout(() => {
      this.elements.waveAnnouncement.classList.add('hidden');
    }, 2500);
  }

  showWaveComplete() {
    if (this.waveCompleteTimeout) {
      clearTimeout(this.waveCompleteTimeout);
    }

    this.elements.waveComplete.classList.remove('hidden');

    this.waveCompleteTimeout = setTimeout(() => {
      this.elements.waveComplete.classList.add('hidden');
    }, 2500);
  }

  toggleVolumeSlider() {
    if (this.volumeSliderVisible) {
      this.hideVolumeSlider();
    } else {
      this.showVolumeSlider();
    }
  }

  showVolumeSlider() {
    this.volumeSliderVisible = true;
    this.elements.volumeSlider.classList.remove('hidden');
    // Sync slider with current volume
    const currentVolume = Math.round(this.game.musicVolume * 100);
    this.elements.volumeRange.value = currentVolume;
    this.elements.volumeValue.textContent = currentVolume + '%';
  }

  hideVolumeSlider() {
    this.volumeSliderVisible = false;
    this.elements.volumeSlider.classList.add('hidden');
  }

  setupOrientationHint() {
    // Only show on touch devices
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouchDevice || !this.elements.orientationHint) return;

    // Check orientation and show hint if portrait
    const checkOrientation = () => {
      if (this.orientationDismissed) return;

      const isPortrait = window.innerHeight > window.innerWidth;
      if (isPortrait) {
        this.elements.orientationHint.classList.add('show');
      } else {
        this.elements.orientationHint.classList.remove('show');
      }
    };

    // Dismiss button handler
    if (this.elements.dismissOrientation) {
      this.elements.dismissOrientation.addEventListener('click', () => {
        this.orientationDismissed = true;
        this.elements.orientationHint.classList.remove('show');
      });
      this.elements.dismissOrientation.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.orientationDismissed = true;
        this.elements.orientationHint.classList.remove('show');
      }, { passive: false });
    }

    // Check on load and orientation change
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkOrientation, 100);
    });
  }
}
