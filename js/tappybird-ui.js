
const TappyUI = {
  updateHUD(game) {
    document.getElementById('score').textContent = game.score;
    document.getElementById('highScore').textContent = TappyStorage.getHighScore();
  },

  showMenu() {
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    menuContent.innerHTML = `
      <div class="menu">
        <h1>🐦 Tappy Bird 🐦</h1>
        <p class="subtitle">💫 Tap or press Space to flap through pipes! 💫</p>
        <div class="menu-buttons">
          <button class="btn primary" onclick="TappyGame.startGame(); TappyUI.hideOverlay();">🎮 Play Game</button>
          <button class="btn" onclick="TappyUI.showStats();">📊 View Stats</button>
        </div>
        <div class="high-score">
          🏆 High Score: ${TappyStorage.getHighScore()}
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: var(--muted); opacity: 0.7;">
          🌙 Watch the day/night cycle as you play! 🌞
        </p>
        <button class="reset-btn" onclick="TappyUI.showResetConfirmation();" title="Reset all progress">🗑️ Reset Progress</button>
      </div>
    `;

    overlay.style.display = 'flex';
  },

  hideOverlay() {
    document.getElementById('overlay').style.display = 'none';
  },

  showGameOver(game) {
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    const isHighScore = game.score === TappyStorage.getHighScore();
    const totalGames = TappyStorage.getTotalGames();

    
    let message = '';
    if (isHighScore) {
      message = '🎊 Amazing! New record! 🎊';
    } else if (game.score >= TappyStorage.getHighScore() * 0.8) {
      message = '🔥 So close to your best! 🔥';
    } else if (game.score >= 10) {
      message = '💪 Great run! Keep it up! 💪';
    } else if (game.score >= 5) {
      message = '👍 Nice try! Practice makes perfect! 👍';
    } else {
      message = '🎯 Every attempt counts! 🎯';
    }

    menuContent.innerHTML = `
      <div class="gameover">
        <h2>${isHighScore ? '🏆 New High Score! 🏆' : '💫 Game Over 💫'}</h2>
        <p style="color: var(--muted); margin-bottom: 20px; font-size: 14px;">${message}</p>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">Your Score</div>
            <div class="stat-value">${game.score}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Best Score</div>
            <div class="stat-value">${TappyStorage.getHighScore()}</div>
          </div>
        </div>
        <div class="menu-buttons">
          <button class="btn primary" onclick="TappyGame.startGame(); TappyUI.hideOverlay();">🎮 Play Again</button>
          <button class="btn" onclick="TappyUI.showStats();">📊 View Stats</button>
          <button class="btn" onclick="location.reload();">🏠 Main Menu</button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
  },

  showStats() {
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    const totalGames = TappyStorage.getTotalGames();
    const totalScore = TappyStorage.getTotalScore();
    const avgScore = totalGames > 0 ? Math.floor(totalScore / totalGames) : 0;
    const highScore = TappyStorage.getHighScore();

    
    let rank = '🐣 Beginner';
    if (highScore >= 50) rank = '🦅 Legend';
    else if (highScore >= 30) rank = '🦉 Expert';
    else if (highScore >= 20) rank = '🐧 Pro';
    else if (highScore >= 10) rank = '🐦 Intermediate';

    menuContent.innerHTML = `
      <div class="stats-view">
        <h2>📊 Your Statistics 📊</h2>
        <p style="color: var(--accent); margin-bottom: 20px; font-size: 16px; font-weight: 600;">${rank}</p>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">🎮 ${totalGames}</div>
            <div class="stat-label">Games Played</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">🏆 ${highScore}</div>
            <div class="stat-label">High Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">⭐ ${totalScore}</div>
            <div class="stat-label">Total Points</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">📈 ${avgScore}</div>
            <div class="stat-label">Average Score</div>
          </div>
        </div>
        <div class="menu-buttons">
          <button class="btn primary" onclick="TappyGame.startGame(); TappyUI.hideOverlay();">🎮 Play Now</button>
          <button class="btn" onclick="TappyUI.showMenu();">← Back</button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
  },

  showVolumeMenu() {
    
    if (TappyGame.state === 'playing') {
      TappyGame.pause();
    }

    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    const settings = TappyStorage.getSettings();
    const volume = Math.round(settings.sfxVolume * 100);
    const isMuted = settings.muted || false;

    menuContent.innerHTML = `
      <div class="volume-menu">
        <h3>⚙️ Settings</h3>
        <div class="volume-control">
          <label>
            Volume: <span class="volume-value" id="volumeValue">${volume}%</span>
          </label>
          <input
            type="range"
            class="volume-slider"
            id="volumeSlider"
            min="0"
            max="100"
            value="${volume}"
            oninput="TappyUI.updateVolume(this.value)"
          />
        </div>
        <div class="volume-buttons">
          <button class="btn" onclick="TappyUI.toggleMute()" id="muteBtn">
            ${isMuted ? '🔇 Unmute' : '🔊 Mute'}
          </button>
          <button class="btn primary" onclick="TappyUI.resumeGame();">
            ▶ Resume
          </button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
  },

  updateVolume(value) {
    const volumeValue = document.getElementById('volumeValue');
    volumeValue.textContent = value + '%';

    const settings = TappyStorage.getSettings();
    settings.sfxVolume = value / 100;
    settings.musicVolume = value / 100;
    TappyStorage.set(TappyStorage.KEYS.SETTINGS, settings);

    AudioManager.setVolume(value / 100);
  },

  toggleMute() {
    const settings = TappyStorage.getSettings();
    settings.muted = !settings.muted;
    TappyStorage.set(TappyStorage.KEYS.SETTINGS, settings);

    AudioManager.setMuted(settings.muted);

    const muteBtn = document.getElementById('muteBtn');
    muteBtn.textContent = settings.muted ? '🔇 Unmute' : '🔊 Mute';

    
    this.updateVolumeButtonIcon();
  },

  resumeGame() {
    this.hideOverlay();
    if (TappyGame.pausedState === 'playing') {
      TappyGame.resume();
    }
  },

  updateVolumeButtonIcon() {
    const volumeBtn = document.getElementById('volumeBtn');
    if (volumeBtn) {
      const settings = TappyStorage.getSettings();
      volumeBtn.textContent = settings.muted ? '🔇' : '🔊';
    }
  },

  showResetConfirmation() {
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    menuContent.innerHTML = `
      <div class="reset-confirmation">
        <h2>⚠️ Reset Progress ⚠️</h2>
        <p style="color: var(--muted); margin: 20px 0; font-size: 16px;">
          Are you sure you want to reset all your progress?
        </p>
        <p style="color: var(--danger); margin-bottom: 30px; font-size: 14px;">
          This will permanently delete:
        </p>
        <div style="text-align: left; margin: 0 auto 30px; max-width: 300px;">
          <div style="margin-bottom: 8px;">🏆 High Score: ${TappyStorage.getHighScore()}</div>
          <div style="margin-bottom: 8px;">🎮 Games Played: ${TappyStorage.getTotalGames()}</div>
          <div style="margin-bottom: 8px;">⭐ Total Points: ${TappyStorage.getTotalScore()}</div>
        </div>
        <div class="menu-buttons">
          <button class="btn" onclick="TappyUI.showMenu();">← Cancel</button>
          <button class="btn primary" style="background: var(--danger); border-color: var(--danger);" onclick="TappyUI.confirmReset();">🗑️ Reset Everything</button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
  },

  confirmReset() {
    TappyStorage.resetAll();

    const menuContent = document.getElementById('menuContent');
    menuContent.innerHTML = `
      <div class="reset-confirmation">
        <h2>✅ Progress Reset ✅</h2>
        <p style="color: var(--good); margin: 20px 0; font-size: 16px;">
          All progress has been cleared!
        </p>
        <p style="color: var(--muted); margin-bottom: 30px; font-size: 14px;">
          Start fresh and set new records! 🎯
        </p>
        <div class="menu-buttons">
          <button class="btn primary" onclick="TappyUI.showMenu();">← Back to Menu</button>
        </div>
      </div>
    `;

    this.updateHUD({ score: 0 });
  },
};


window.TappyUI = TappyUI;
