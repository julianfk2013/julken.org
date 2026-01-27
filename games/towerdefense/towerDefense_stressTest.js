// Stress Test Mode for Tower Defense
// Runs the game at high speed and performs random actions to find bugs

class StressTest {
  constructor(game) {
    this.game = game;
    this.running = false;
    this.speed = 50; // Speed multiplier (50x default)
    this.actionInterval = 100; // ms between random actions
    this.errors = [];
    this.warnings = [];
    this.actionsPerformed = 0;
    this.startTime = null;
    this.infiniteMoney = false;
    this.infiniteLives = false;

    this.originalUpdate = null;
    this.actionTimer = null;

    this.createUI();
    this.hookErrors();
  }

  createUI() {
    // Create stress test control panel
    const panel = document.createElement('div');
    panel.id = 'stress-test-panel';
    panel.innerHTML = `
      <style>
        #stress-test-panel {
          position: fixed;
          top: 10px;
          left: 10px;
          background: rgba(0,0,0,0.95);
          border: 2px solid #ff0000;
          border-radius: 8px;
          padding: 15px;
          z-index: 10000;
          font-family: monospace;
          font-size: 12px;
          color: #fff;
          max-width: 350px;
          max-height: 80vh;
          overflow-y: auto;
        }
        #stress-test-panel h3 {
          margin: 0 0 10px;
          color: #ff6600;
          font-size: 14px;
        }
        #stress-test-panel .controls {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        #stress-test-panel button {
          padding: 6px 12px;
          border: 1px solid #666;
          border-radius: 4px;
          background: #333;
          color: #fff;
          cursor: pointer;
          font-size: 11px;
        }
        #stress-test-panel button:hover {
          background: #555;
        }
        #stress-test-panel button.active {
          background: #006600;
          border-color: #00ff00;
        }
        #stress-test-panel .stats {
          margin: 10px 0;
          padding: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        #stress-test-panel .stat-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        #stress-test-panel .errors-section {
          margin-top: 10px;
          max-height: 200px;
          overflow-y: auto;
        }
        #stress-test-panel .error-item {
          padding: 4px 6px;
          margin: 2px 0;
          background: rgba(255,0,0,0.2);
          border-left: 3px solid #ff0000;
          font-size: 10px;
          word-break: break-all;
        }
        #stress-test-panel .warning-item {
          padding: 4px 6px;
          margin: 2px 0;
          background: rgba(255,165,0,0.2);
          border-left: 3px solid #ffa500;
          font-size: 10px;
        }
        #stress-test-panel .speed-control {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 8px 0;
        }
        #stress-test-panel input[type="range"] {
          flex: 1;
        }
        #stress-test-panel .close-btn {
          position: absolute;
          top: 5px;
          right: 8px;
          background: none;
          border: none;
          color: #999;
          font-size: 18px;
          cursor: pointer;
        }
      </style>
      <button class="close-btn" onclick="stressTest.hidePanel()">&times;</button>
      <h3>🧪 STRESS TEST MODE</h3>
      <div class="controls">
        <button id="st-start">▶ Start</button>
        <button id="st-stop">⏹ Stop</button>
        <button id="st-clear">🗑 Clear Errors</button>
        <button id="st-money">💰 +100K</button>
      </div>
      <div class="controls" style="margin-top:4px">
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
          <input type="checkbox" id="st-inf-money"> Infinite Money
        </label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
          <input type="checkbox" id="st-inf-lives"> Infinite Lives
        </label>
      </div>
      <div class="speed-control">
        <span>Speed:</span>
        <input type="range" id="st-speed" min="1" max="500" value="50">
        <span id="st-speed-val">50x</span>
      </div>
      <div class="stats">
        <div class="stat-row"><span>Status:</span><span id="st-status">Stopped</span></div>
        <div class="stat-row"><span>Actions:</span><span id="st-actions">0</span></div>
        <div class="stat-row"><span>Runtime:</span><span id="st-runtime">0s</span></div>
        <div class="stat-row"><span>Errors:</span><span id="st-error-count" style="color:#ff4444">0</span></div>
        <div class="stat-row"><span>Warnings:</span><span id="st-warning-count" style="color:#ffaa00">0</span></div>
        <div class="stat-row"><span>Wave:</span><span id="st-wave">-</span></div>
        <div class="stat-row"><span>Towers:</span><span id="st-towers">0</span></div>
        <div class="stat-row"><span>Enemies:</span><span id="st-enemies">0</span></div>
        <div class="stat-row"><span>Money:</span><span id="st-money-val" style="color:#ffff00">0</span></div>
        <div class="stat-row"><span>Lives:</span><span id="st-lives-val" style="color:#ff6666">0</span></div>
      </div>
      <div class="errors-section">
        <div id="st-errors-list"></div>
      </div>
    `;
    document.body.appendChild(panel);

    // Event listeners
    document.getElementById('st-start').addEventListener('click', () => this.start());
    document.getElementById('st-stop').addEventListener('click', () => this.stop());
    document.getElementById('st-clear').addEventListener('click', () => this.clearErrors());
    document.getElementById('st-money').addEventListener('click', () => {
      if (this.game) this.game.money += 100000;
    });
    document.getElementById('st-speed').addEventListener('input', (e) => {
      this.speed = parseInt(e.target.value);
      document.getElementById('st-speed-val').textContent = this.speed + 'x';
    });
    document.getElementById('st-inf-money').addEventListener('change', (e) => {
      this.infiniteMoney = e.target.checked;
    });
    document.getElementById('st-inf-lives').addEventListener('change', (e) => {
      this.infiniteLives = e.target.checked;
    });

    // Cheat enforcement loop
    setInterval(() => {
      if (this.game && this.game.state === 'playing') {
        if (this.infiniteMoney) this.game.money = 999999;
        if (this.infiniteLives) this.game.lives = 999;
      }
    }, 100);
  }

  hidePanel() {
    document.getElementById('stress-test-panel').style.display = 'none';
  }

  showPanel() {
    document.getElementById('stress-test-panel').style.display = 'block';
  }

  hookErrors() {
    // Capture console errors
    const originalError = console.error;
    console.error = (...args) => {
      this.logError('Console Error: ' + args.join(' '));
      originalError.apply(console, args);
    };

    const originalWarn = console.warn;
    console.warn = (...args) => {
      this.logWarning('Console Warning: ' + args.join(' '));
      originalWarn.apply(console, args);
    };

    // Capture uncaught errors
    window.addEventListener('error', (e) => {
      this.logError(`Uncaught: ${e.message} at ${e.filename}:${e.lineno}`);
    });

    // Capture promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.logError(`Promise Rejection: ${e.reason}`);
    });
  }

  logError(msg) {
    const entry = {
      time: Date.now(),
      message: msg,
      gameState: this.getGameState()
    };
    this.errors.push(entry);
    this.updateErrorsList();
  }

  logWarning(msg) {
    const entry = {
      time: Date.now(),
      message: msg
    };
    this.warnings.push(entry);
    this.updateErrorsList();
  }

  getGameState() {
    try {
      return {
        state: this.game.state,
        wave: this.game.currentWave,
        money: this.game.money,
        lives: this.game.lives,
        towers: this.game.towers?.length || 0,
        enemies: this.game.enemies?.length || 0,
        projectiles: this.game.projectiles?.length || 0
      };
    } catch (e) {
      return { error: 'Could not get state' };
    }
  }

  updateErrorsList() {
    const list = document.getElementById('st-errors-list');
    document.getElementById('st-error-count').textContent = this.errors.length;
    document.getElementById('st-warning-count').textContent = this.warnings.length;

    let html = '';

    // Show last 20 errors
    const recentErrors = this.errors.slice(-20).reverse();
    for (const err of recentErrors) {
      html += `<div class="error-item">${err.message}<br><small>State: ${JSON.stringify(err.gameState)}</small></div>`;
    }

    // Show last 10 warnings
    const recentWarnings = this.warnings.slice(-10).reverse();
    for (const warn of recentWarnings) {
      html += `<div class="warning-item">${warn.message}</div>`;
    }

    list.innerHTML = html;
  }

  clearErrors() {
    this.errors = [];
    this.warnings = [];
    this.updateErrorsList();
  }

  start() {
    if (this.running) return;

    this.running = true;
    this.startTime = Date.now();
    this.actionsPerformed = 0;

    document.getElementById('st-start').classList.add('active');
    document.getElementById('st-status').textContent = 'RUNNING';
    document.getElementById('st-status').style.color = '#00ff00';

    // Auto-start game if in menu
    if (this.game.state === 'menu') {
      // Pick random difficulty
      const modes = ['easy', 'hard', 'endless-easy', 'endless-hard'];
      const mode = modes[Math.floor(Math.random() * modes.length)];
      this.game.startGame(mode);
      document.getElementById('menu-overlay').style.display = 'none';
    }

    // Start action loop
    this.actionTimer = setInterval(() => this.performRandomAction(), this.actionInterval);

    // Start stats update
    this.statsTimer = setInterval(() => this.updateStats(), 200);

    // Override game loop for speed
    this.injectSpeedMultiplier();
  }

  stop() {
    this.running = false;

    document.getElementById('st-start').classList.remove('active');
    document.getElementById('st-status').textContent = 'Stopped';
    document.getElementById('st-status').style.color = '#ffffff';

    if (this.actionTimer) {
      clearInterval(this.actionTimer);
      this.actionTimer = null;
    }
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }

    // Remove speed override
    this.removeSpeedMultiplier();
  }

  injectSpeedMultiplier() {
    // Store original deltaTime calculation
    if (!this.game._originalUpdate) {
      this.game._originalUpdate = this.game.update.bind(this.game);

      const self = this;
      this.game.update = function(dt) {
        // Multiply deltaTime by speed factor
        const speedDt = dt * self.speed;

        // Call multiple updates per frame for very high speeds
        const iterations = Math.min(Math.ceil(self.speed / 10), 50);
        const iterDt = speedDt / iterations;

        for (let i = 0; i < iterations; i++) {
          try {
            self.game._originalUpdate(iterDt);
          } catch (e) {
            self.logError(`Update error: ${e.message}`);
          }
        }
      };
    }
  }

  removeSpeedMultiplier() {
    if (this.game._originalUpdate) {
      this.game.update = this.game._originalUpdate;
      delete this.game._originalUpdate;
    }
  }

  updateStats() {
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    document.getElementById('st-actions').textContent = this.actionsPerformed;
    document.getElementById('st-runtime').textContent = runtime + 's';
    document.getElementById('st-wave').textContent = this.game.currentWave || '-';
    document.getElementById('st-towers').textContent = this.game.towers?.length || 0;
    document.getElementById('st-enemies').textContent = this.game.enemies?.length || 0;
    document.getElementById('st-money-val').textContent = this.game.money || 0;
    document.getElementById('st-lives-val').textContent = this.game.lives || 0;
  }

  performRandomAction() {
    if (!this.running || this.game.state !== 'playing') {
      // Auto-restart if game ended
      if (this.game.state === 'won' || this.game.state === 'lost') {
        setTimeout(() => {
          document.getElementById('result-overlay').style.display = 'none';
          document.getElementById('menu-overlay').style.display = 'none';
          const modes = ['easy', 'hard', 'endless-easy', 'endless-hard'];
          const mode = modes[Math.floor(Math.random() * modes.length)];
          this.game.startGame(mode);
        }, 500);
      }
      return;
    }

    try {
      const action = Math.random();

      if (action < 0.3) {
        // Build random tower
        this.tryBuildRandomTower();
      } else if (action < 0.4) {
        // Upgrade random tower
        this.tryUpgradeRandomTower();
      } else if (action < 0.45) {
        // Sell random tower
        this.trySellRandomTower();
      } else if (action < 0.6) {
        // Start next wave
        if (!this.game.waveInProgress) {
          this.game.startNextWave();
        }
      } else if (action < 0.65) {
        // Test pause/resume
        if (this.game.state === 'playing') {
          this.game.pause();
          setTimeout(() => this.game.resume(), 50);
        }
      } else if (action < 0.7) {
        // Test music toggle
        this.game.toggleMute();
      } else if (action < 0.75) {
        // Test volume change
        this.game.setVolume(Math.floor(Math.random() * 100));
      } else {
        // Click random spot on canvas
        this.simulateCanvasClick();
      }

      this.actionsPerformed++;
    } catch (e) {
      this.logError(`Action error: ${e.message}`);
    }
  }

  tryBuildRandomTower() {
    const towerTypes = ['laser', 'rocket', 'plasma', 'tesla', 'sniper', 'flame', 'railgun', 'freeze', 'annihilator'];
    const type = towerTypes[Math.floor(Math.random() * towerTypes.length)];

    // Find random buildable position
    const gridW = CONFIG.GRID_WIDTH;
    const gridH = CONFIG.GRID_HEIGHT;

    for (let attempts = 0; attempts < 10; attempts++) {
      const x = Math.floor(Math.random() * gridW);
      const y = Math.floor(Math.random() * gridH);

      if (this.game.canBuildAt(x, y)) {
        this.game.tryBuildTower(x, y, type);
        return;
      }
    }
  }

  tryUpgradeRandomTower() {
    if (this.game.towers && this.game.towers.length > 0) {
      const tower = this.game.towers[Math.floor(Math.random() * this.game.towers.length)];
      if (tower && tower.canUpgrade()) {
        this.game.upgradeTower(tower);
      }
    }
  }

  trySellRandomTower() {
    if (this.game.towers && this.game.towers.length > 0) {
      const tower = this.game.towers[Math.floor(Math.random() * this.game.towers.length)];
      if (tower) {
        this.game.sellTower(tower);
      }
    }
  }

  simulateCanvasClick() {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;

    const event = new MouseEvent('click', {
      clientX: rect.left + x,
      clientY: rect.top + y
    });
    canvas.dispatchEvent(event);
  }
}

// Initialize stress test when game is ready
let stressTest;
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // Find the game instance
    const gameCheck = setInterval(() => {
      if (window.game || document.querySelector('#game')) {
        clearInterval(gameCheck);

        // Get game instance (it's created globally in towerDefense_game.js)
        const gameCanvas = document.getElementById('game');
        if (gameCanvas && gameCanvas._game) {
          stressTest = new StressTest(gameCanvas._game);
        } else {
          // Try to find it another way - check for global
          setTimeout(() => {
            // The game creates itself, we need to hook into it
            const games = document.querySelectorAll('canvas');
            for (const c of games) {
              if (c._game) {
                stressTest = new StressTest(c._game);
                return;
              }
            }
            // Last resort - create with window reference
            console.log('Stress test: Looking for game instance...');
          }, 1000);
        }
      }
    }, 100);
  }, 500);
});

// Also expose for manual initialization
window.initStressTest = function(game) {
  stressTest = new StressTest(game);
  return stressTest;
};
