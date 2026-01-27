const UI = {
  menuAnimationId: null,

  updateHUD(game) {
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = `Wave ${game.wave}`;
    document.getElementById('combo').textContent = game.killStreak > 0 ? `Streak: ${game.killStreak}` : game.combo.toFixed(1) + 'x';
    document.getElementById('coins').textContent = Storage.getTotalCoins();

    const livesEl = document.getElementById('lives');
    if (livesEl && game.player) {
      const hpPercent = Math.floor((game.player.hp / game.player.maxHp) * 100);
      livesEl.textContent = `${hpPercent}%`;
    }

    this.updatePowerupsDisplay(game.activePowerups);
  },

  updatePowerupsDisplay(powerups) {
    const container = document.getElementById('activePowerups');
    if (!container) return;

    container.innerHTML = powerups.map(p => `
      <div class="powerup-badge" style="background: ${p.props.color}">
        <span>${p.props.icon}</span>
        <div class="powerup-timer" style="width: ${(p.timer / p.props.duration) * 100}%"></div>
      </div>
    `).join('');
  },

  showMenu() {
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    menuContent.innerHTML = `
      <div class="menu">
        <div class="scanline-overlay"></div>
        <canvas class="menu-particles" width="600" height="600"></canvas>
        <h1>Galactic Assault</h1>
        <p class="subtitle">Pilot your spaceship, destroy enemies, defeat bosses!</p>
        <div class="menu-buttons">
          <button class="btn primary" onclick="UI.showModeSelect()">Play</button>
          <button class="btn" onclick="UI.openShop()">Shop 💰</button>
          <button class="btn" onclick="UI.showAchievements()">Achievements</button>
          <button class="btn" onclick="UI.showSettings()">Settings</button>
          <button class="btn" onclick="UI.showStats()">Stats</button>
        </div>
        <div class="high-score">
          High Score: ${Storage.getHighScore()}
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
    this.initMenuParticles();
  },

  showModeSelect() {
    const menuContent = document.getElementById('menuContent');

    menuContent.innerHTML = `
      <div class="mode-select">
        <div class="scanline-overlay"></div>
        <h2>Select Game Mode</h2>
        <div class="mode-grid">
          <div class="mode-card" data-mode="classic">
            <h3>Classic</h3>
            <p>Progressive waves with boss fights every 5 waves</p>
          </div>
          <div class="mode-card" data-mode="survival">
            <h3>Survival</h3>
            <p>Enemies get faster and more aggressive over time</p>
          </div>
          <div class="mode-card" data-mode="timeattack">
            <h3>Time Attack</h3>
            <p>Instant enemy spawns. Race the clock for bonus points</p>
          </div>
          <div class="mode-card" data-mode="bossrush">
            <h3>Boss Rush</h3>
            <p>5 bosses. Each stronger and faster than the last</p>
          </div>
          <div class="mode-card" data-mode="daily">
            <h3>Challenge</h3>
            <p>5 bosses at once. Extreme difficulty for experts</p>
          </div>
          <div class="mode-card" data-mode="zen">
            <h3>Zen Mode</h3>
            <p>Slow enemies, no bosses. Infinite HP. Pure relaxation</p>
          </div>
        </div>
        <button class="btn" onclick="UI.showMenu()">Back</button>
      </div>
    `;

    // Add touch/click handlers for iOS compatibility (onclick on divs is unreliable on iPad)
    menuContent.querySelectorAll('.mode-card[data-mode]').forEach(card => {
      const mode = card.dataset.mode;
      const startGame = () => {
        Game.startGame(mode);
        UI.hideOverlay();
      };
      card.addEventListener('click', startGame);
      card.addEventListener('touchend', (e) => {
        e.preventDefault();
        startGame();
      });
    });
  },

  hideOverlay() {
    if (this.menuAnimationId) {
      cancelAnimationFrame(this.menuAnimationId);
      this.menuAnimationId = null;
    }
    document.getElementById('overlay').style.display = 'none';
  },

  showPause() {
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    menuContent.innerHTML = `
      <div class="pause-menu">
        <h2>Paused</h2>
        <div class="menu-buttons">
          <button class="btn primary" onclick="Game.resume(); UI.hideOverlay();">Resume</button>
          <button class="btn" onclick="UI.showSettings();">Settings</button>
          <button class="btn" onclick="location.reload();">Quit to Menu</button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
  },

  hidePause() {
    this.hideOverlay();
  },

  showBossWarning() {
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    menuContent.innerHTML = `
      <div class="boss-warning">
        <h2>⚠️ Boss Incoming!</h2>
        <p class="warning-text">Prepare yourself for an epic battle!</p>
        <div class="menu-buttons">
          <button class="btn primary" onclick="Game.startBossFight(); UI.hideOverlay();">I'm Ready!</button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
  },

  showBossRushVictory(game) {
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    const difficultyLevel = game.bossRushDifficulty || 1;

    menuContent.innerHTML = `
      <div class="gameover">
        <h2>🎉 Congrats! You won the challenge! 🎉</h2>
        <p class="victory-subtitle">Difficulty Level: ${difficultyLevel}</p>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">Score</div>
            <div class="stat-value">${game.score}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Bosses Defeated</div>
            <div class="stat-value">${game.bossesDefeated}</div>
          </div>
        </div>
        <div class="menu-buttons">
          <button class="btn primary" onclick="Game.startGame('bossrush', ${difficultyLevel + 1}); UI.hideOverlay();">Harder</button>
          <button class="btn" onclick="location.reload();">Back to Home</button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
  },

  showGameOver(game) {
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    const isHighScore = game.score === Storage.getHighScore();

    menuContent.innerHTML = `
      <div class="gameover">
        <h2>${isHighScore ? '🏆 New High Score!' : 'Game Over'}</h2>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">Score</div>
            <div class="stat-value">${game.score}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Wave</div>
            <div class="stat-value">${game.wave}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Enemies</div>
            <div class="stat-value">${game.enemiesDestroyed}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Best Streak</div>
            <div class="stat-value">${game.killStreak}x</div>
          </div>
        </div>
        <div class="menu-buttons">
          <button class="btn primary" onclick="Game.startGame('${game.mode}'); UI.hideOverlay();">Play Again</button>
          <button class="btn" onclick="location.reload();">Main Menu</button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
  },

  openShop() {
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    menuContent.innerHTML = '<div id="shopContainer"></div>';
    Shop.init();
    overlay.style.display = 'flex';
  },

  closeShop() {
    this.showMenu();
  },

  showAchievements() {
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    const unlockedIds = Storage.getAchievements();

    let html = '<div class="achievements"><h2>Achievements</h2><div class="achievement-grid">';

    if (typeof ACHIEVEMENTS === 'undefined' || !ACHIEVEMENTS || !Array.isArray(ACHIEVEMENTS)) {
      html += '<p style="color: #ef4444;">Achievements failed to load. Please refresh the page.</p>';
    } else {
      ACHIEVEMENTS.forEach(ach => {
        const unlocked = unlockedIds.includes(ach.id);
        html += `
          <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${unlocked ? '🏆' : '🔒'}</div>
            <h3>${ach.name}</h3>
            <p>${ach.desc}</p>
            <div class="achievement-reward">+${ach.reward} 💰</div>
          </div>
        `;
      });
    }

    html += '</div><button class="btn" onclick="UI.showMenu()">Back</button></div>';
    menuContent.innerHTML = html;
    overlay.style.display = 'flex';
  },

  showSettings() {
    const settings = Storage.getSettings();
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    menuContent.innerHTML = `
      <div class="settings">
        <h2>Settings</h2>
        <div class="settings-grid">
          <div class="setting">
            <label>Music Volume</label>
            <input type="range" min="0" max="100" value="${settings.musicVolume * 100}"
                   oninput="AudioManager.setMusicVolume(this.value / 100)">
          </div>
          <div class="setting">
            <label>SFX Volume</label>
            <input type="range" min="0" max="100" value="${settings.sfxVolume * 100}"
                   oninput="AudioManager.setSFXVolume(this.value / 100)">
          </div>
          <div class="setting">
            <label>Particle Quality</label>
            <select onchange="Storage.setSetting('particleQuality', this.value)">
              <option value="low" ${settings.particleQuality === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${settings.particleQuality === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${settings.particleQuality === 'high' ? 'selected' : ''}>High</option>
            </select>
          </div>
        </div>
        <button class="btn" onclick="UI.showMenu()">Back</button>
        <button class="btn" style="background: #ef4444; margin-top: 20px;"
                onclick="Storage.resetAll()">Reset All Data</button>
      </div>
    `;

    overlay.style.display = 'flex';
  },

  showStats() {
    const stats = Storage.getStats();
    const overlay = document.getElementById('overlay');
    const menuContent = document.getElementById('menuContent');

    menuContent.innerHTML = `
      <div class="stats-view">
        <h2>Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.gamesPlayed || 0}</div>
            <div class="stat-label">Games Played</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Storage.getTotalBricks()}</div>
            <div class="stat-label">Enemies Destroyed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Storage.getTotalCoins()}</div>
            <div class="stat-label">Total Coins</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Storage.getBossesDefeated().length}</div>
            <div class="stat-label">Bosses Defeated</div>
          </div>
        </div>
        <button class="btn" onclick="UI.showMenu()">Back</button>
      </div>
    `;

    overlay.style.display = 'flex';
  },

  initMenuParticles() {
    if (this.menuAnimationId) {
      cancelAnimationFrame(this.menuAnimationId);
      this.menuAnimationId = null;
    }

    const canvas = document.querySelector('.menu-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.3
      });
    }

    let lastTime = performance.now();

    const animate = (currentTime) => {
      if (!document.querySelector('.menu-particles')) {
        this.menuAnimationId = null;
        return;
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 10;
        ctx.shadowColor = '#38bdf8';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 120) * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      this.menuAnimationId = requestAnimationFrame(animate);
    };

    this.menuAnimationId = requestAnimationFrame(animate);
  }
};

const AchievementSystem = {
  unlock(achievementId) {
    if (Storage.unlockAchievement(achievementId)) {
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (achievement) {
        this.showNotification(achievement);
        Storage.addCoins(achievement.reward);
      }
    }
  },

  showNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div>
        <div class="achievement-title">Achievement Unlocked!</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-reward">+${achievement.reward} 💰</div>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  }
};
