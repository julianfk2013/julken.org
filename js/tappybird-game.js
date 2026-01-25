
const TappyGame = {
  canvas: null,
  ctx: null,
  state: 'menu',
  pausedState: null,

  bird: null,
  pipes: [],
  particles: [],

  score: 0,
  pipeSpawnTimer: 0,

  scoreScale: 1,
  scoreAnimTimer: 0,
  scoreRotation: 0,

  keys: {},
  lastTime: 0,
  deltaTime: 0,

  flashTimer: 0,
  debugMode: false,
  cheatMode: false,
  cheatScoreTimer: 0,

  crashTimer: 0,
  crashDuration: 1800,
  shakeIntensity: 0,
  birdFallRotation: 0,
  birdHitGround: false,
  deadBirdX: 0,
  deadBirdY: 0,
  deadBirdRotation: 0,

  init(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    
    if (assets) {
      Assets.setAssets(assets);
    }

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    Background.init();

    this.setupInput();
    this.startGameLoop();
  },

  resizeCanvas() {
    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;
  },

  setupInput() {
    
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      if (e.key.toLowerCase() === 'h') {
        this.debugMode = !this.debugMode;
      }

      if ((e.key === ' ' || e.key === 'ArrowUp') && this.state === 'playing') {
        this.bird.flap();
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    
    this.canvas.addEventListener('mousedown', () => {
      if (this.state === 'playing') {
        this.bird.flap();
      }
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (this.state === 'playing') {
        this.bird.flap();
        e.preventDefault();
      }
    }, { passive: false });
  },

  startGame() {
    this.state = 'playing';
    this.score = 0;
    this.pipeSpawnTimer = 0;
    this.flashTimer = 0;
    this.scoreScale = 1;
    this.scoreAnimTimer = 0;
    this.scoreRotation = 0;
    this.crashTimer = 0;
    this.shakeIntensity = 0;
    this.birdFallRotation = 0;
    this.birdHitGround = false;

    this.bird = new Bird(CONFIG.BIRD_X, CONFIG.BIRD_START_Y);
    this.pipes = [];
    this.particles = [];

    TappyStorage.incrementGames();

    setTimeout(() => {
      if (this.state === 'playing') {
        this.spawnPipe();
      }
    }, 1000);
  },

  pause() {
    if (this.state === 'playing') {
      this.pausedState = 'playing';
      this.state = 'paused';
      AudioManager.pauseMusic();
    }
  },

  resume() {
    if (this.state === 'paused' && this.pausedState === 'playing') {
      this.state = 'playing';
      this.pausedState = null;
      AudioManager.playMusic();
    }
  },

  startGameLoop() {
    this.lastTime = performance.now();

    const loop = (currentTime) => {
      this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      this.update(this.deltaTime);
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  },

  update(dt) {
    if (this.state === 'paused') return;

    if (this.state === 'crashing') {
      this.crashTimer += dt * 1000;

      const crashProgress = this.crashTimer / this.crashDuration;

      if (this.crashTimer < 400) {
        this.shakeIntensity = 15 * (1 - this.crashTimer / 400);
      } else {
        this.shakeIntensity = 0;

        if (!this.birdHitGround) {
          const bounds = this.bird.getBounds();
          const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;

          if (bounds.y + bounds.height < groundY) {
            this.bird.velocity += CONFIG.GRAVITY * dt * 1.5;
            this.bird.y += this.bird.velocity * dt;
            this.birdFallRotation += dt * 720;
          } else {
            this.bird.y = groundY - bounds.height - CONFIG.BIRD_HITBOX_PADDING;
            this.bird.velocity = 0;
            this.birdHitGround = true;
            this.birdFallRotation = Math.floor(this.birdFallRotation / 360) * 360;
          }
        }
      }

      this.particles = this.particles.filter(particle => {
        particle.update(dt);
        return !particle.dead;
      });

      if (this.crashTimer >= this.crashDuration) {
        this.state = 'gameover';
        this.bird.dead = true;
        this.deadBirdX = this.bird.x;
        this.deadBirdY = this.bird.y;
        this.deadBirdRotation = this.birdFallRotation;
        AudioManager.playSound('die');
        TappyUI.showGameOver(this);
      }

      return;
    }

    if (this.state === 'gameover') {
      this.deadBirdX -= CONFIG.GROUND_SCROLL_SPEED * dt;
      return;
    }

    if (this.state !== 'playing') return;

    const speedMultiplier = Math.min(
      1 + (this.score * CONFIG.PIPE_SPEED_INCREASE) / CONFIG.PIPE_SPEED,
      CONFIG.PIPE_MAX_SPEED / CONFIG.PIPE_SPEED
    );

    if (!this.cheatMode) {
      Background.update(dt, speedMultiplier);
    }

    this.bird.update(dt);

    if (this.cheatMode) {
      this.cheatScoreTimer += dt * 1000;
      if (this.cheatScoreTimer >= 10) {
        this.cheatScoreTimer = 0;
        this.score += 1234;
      }
    }

    this.pipeSpawnTimer += dt * 1000;
    if (this.pipeSpawnTimer >= CONFIG.PIPE_SPAWN_INTERVAL) {
      this.pipeSpawnTimer = 0;
      this.spawnPipe();
    }

    const currentSpeed = Math.min(
      CONFIG.PIPE_SPEED + (this.score * CONFIG.PIPE_SPEED_INCREASE),
      CONFIG.PIPE_MAX_SPEED
    );

    this.pipes = this.pipes.filter(pipe => {
      pipe.update(dt, currentSpeed);

      if (!pipe.scored && this.bird.x + this.bird.width / 2 > pipe.x + pipe.width / 2) {
        pipe.scored = true;
        this.score++;

        if (!this.cheatMode) {
          this.scoreScale = 1.5;
          this.scoreAnimTimer = 300;
        }
      }

      return !pipe.destroyed;
    });

    this.particles = this.particles.filter(particle => {
      particle.update(dt);
      return !particle.dead;
    });

    this.checkCollisions();

    if (!this.cheatMode) {
      if (this.scoreAnimTimer > 0) {
        this.scoreAnimTimer -= dt * 1000;

        const progress = this.scoreAnimTimer / 300;
        this.scoreScale = 1 + (0.5 * progress);
      } else {
        this.scoreScale = 1;
      }
    } else {
      this.scoreScale = 1;
    }

    this.scoreRotation += dt * 30;

    if (this.flashTimer > 0) {
      this.flashTimer -= dt * 1000;
    }

    TappyUI.updateHUD(this);
  },

  spawnPipe() {

    const gapReduction = Math.min(this.score * 2, 80);
    const currentGap = Math.max(CONFIG.PIPE_GAP - gapReduction, 120);

    const random = Math.random();
    let gapY;

    if (random < 0.8) {

      const variation = (Math.random() - 0.5) * 2 * CONFIG.GAP_VARIATION;
      gapY = CONFIG.GAP_CENTER_Y - (currentGap / 2) + variation;
    } else if (random < 0.9) {

      const variation = -Math.random() * CONFIG.GAP_VARIATION;
      gapY = CONFIG.GAP_CENTER_Y - (currentGap / 2) + variation;
    } else {

      const variation = Math.random() * CONFIG.GAP_VARIATION;
      gapY = CONFIG.GAP_CENTER_Y - (currentGap / 2) + variation;
    }


    const minGapY = CONFIG.PIPE_MIN_HEIGHT;
    const maxGapY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - currentGap - CONFIG.PIPE_MIN_HEIGHT;
    gapY = Math.max(minGapY, Math.min(maxGapY, gapY));

    const pipe = new Pipe(CONFIG.WIDTH, gapY, currentGap);
    this.pipes.push(pipe);
  },

  checkCollisions() {
    if (this.cheatMode) return;

    const bounds = this.bird.getBounds();

    if (bounds.y + bounds.height >= CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT) {
      const padding = CONFIG.BIRD_HITBOX_PADDING;
      this.bird.y = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - bounds.height - padding;
      this.bird.velocity = Math.min(this.bird.velocity, 0);
    }

    if (bounds.y <= 0) {
      const padding = CONFIG.BIRD_HITBOX_PADDING;
      this.bird.y = -padding;
      this.bird.velocity = Math.max(this.bird.velocity, 0);
    }

    for (const pipe of this.pipes) {
      if (this.rectCollision(bounds, pipe.getTopPipeBounds()) ||
          this.rectCollision(bounds, pipe.getBottomPipeBounds())) {
        this.gameOver();
        return;
      }
    }
  },

  cheat() {
    this.cheatMode = !this.cheatMode;
    if (this.cheatMode) {
      this.scoreScale = 1;
      this.scoreAnimTimer = 0;
      this.cheatScoreTimer = 0;
    }
    console.log(`Cheat mode ${this.cheatMode ? 'ENABLED' : 'DISABLED'}`);
    return this.cheatMode ? '🚀 ZOOOOOM! Noclip activated!' : '🐌 Back to normal';
  },

  disablecheat() {
    if (this.cheatMode) {
      this.cheatMode = false;
      console.log('Cheat mode DISABLED');
      return '🐌 Back to normal';
    }
    return 'Cheat mode is already off';
  },

  rectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  },

  gameOver() {
    this.state = 'crashing';
    this.crashTimer = 0;
    this.flashTimer = CONFIG.FLASH_DURATION;
    this.shakeIntensity = 15;
    this.birdFallRotation = this.bird.rotation;
    this.birdHitGround = false;

    AudioManager.playSound('hit');

    for (let i = 0; i < CONFIG.PARTICLE_COUNT * 2; i++) {
      const angle = (Math.PI * 2 * i) / (CONFIG.PARTICLE_COUNT * 2);
      const speed = 250 + Math.random() * 150;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.particles.push(new Particle(
        this.bird.x + this.bird.width / 2,
        this.bird.y + this.bird.height / 2,
        vx,
        vy,
        COLORS.PARTICLE,
        4 + Math.random() * 6
      ));
    }

    if (this.score > TappyStorage.getHighScore()) {
      TappyStorage.setHighScore(this.score);
    }

    TappyStorage.addToTotalScore(this.score);
  },

  render() {
    this.ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    this.ctx.save();

    if (this.state === 'crashing' && this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(shakeX, shakeY);
    }

    Background.draw(this.ctx);

    if (this.state === 'playing' || this.state === 'paused' || this.state === 'gameover' || this.state === 'crashing') {
      this.pipes.forEach(pipe => pipe.draw(this.ctx));

      this.particles.forEach(particle => particle.draw(this.ctx));

      if (this.state === 'crashing') {
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        this.ctx.rotate((this.birdFallRotation * Math.PI) / 180);

        if (Assets.birdImg && Assets.birdImg.complete) {
          this.ctx.drawImage(Assets.birdImg, -this.bird.width / 2, -this.bird.height / 2, this.bird.width, this.bird.height);
        } else {
          const gradient = this.ctx.createRadialGradient(0, -5, 5, 0, 0, this.bird.width / 2);
          gradient.addColorStop(0, COLORS.BIRD);
          gradient.addColorStop(1, COLORS.BIRD_ACCENT);
          this.ctx.fillStyle = gradient;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, this.bird.width / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();
      } else if (this.state === 'gameover' && this.deadBirdX > -this.bird.width) {
        this.ctx.save();
        this.ctx.translate(this.deadBirdX + this.bird.width / 2, this.deadBirdY + this.bird.height / 2);
        this.ctx.rotate((this.deadBirdRotation * Math.PI) / 180);

        if (Assets.birdImg && Assets.birdImg.complete) {
          this.ctx.drawImage(Assets.birdImg, -this.bird.width / 2, -this.bird.height / 2, this.bird.width, this.bird.height);
        } else {
          const gradient = this.ctx.createRadialGradient(0, -5, 5, 0, 0, this.bird.width / 2);
          gradient.addColorStop(0, COLORS.BIRD);
          gradient.addColorStop(1, COLORS.BIRD_ACCENT);
          this.ctx.fillStyle = gradient;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, this.bird.width / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();
      } else if (this.bird && !this.bird.dead) {
        this.bird.draw(this.ctx);
      }

      
      if (this.state === 'playing' || this.state === 'paused') {
        this.ctx.save();

        const scoreText = this.score.toString();
        const scoreX = CONFIG.WIDTH / 2;
        const scoreY = 60;

        
        this.ctx.translate(scoreX, scoreY);
        this.ctx.scale(this.scoreScale, this.scoreScale);
        this.ctx.rotate((Math.sin(this.scoreRotation / 60) * 5) * Math.PI / 180);

        
        this.ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        
        this.ctx.strokeStyle = COLORS.TEXT_OUTLINE;
        this.ctx.lineWidth = 6;
        this.ctx.font = '900 84px "Impact", "Arial Black", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.strokeText(scoreText, 0, 0);

        
        const gradient = this.ctx.createLinearGradient(0, -42, 0, 42);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.5, '#fbbf24');
        gradient.addColorStop(1, '#f59e0b');
        this.ctx.fillStyle = gradient;
        this.ctx.fillText(scoreText, 0, 0);

        
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(scoreText, 0, -2);

        this.ctx.restore();
      }

      
      if (this.flashTimer > 0) {
        const alpha = this.flashTimer / CONFIG.FLASH_DURATION;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
        this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      }

      if (this.debugMode) {
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        if (this.bird) {
          const birdBounds = this.bird.getBounds();
          this.ctx.strokeRect(birdBounds.x, birdBounds.y, birdBounds.width, birdBounds.height);

          this.ctx.strokeStyle = '#ffff00';
          this.ctx.strokeRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);
        }

        this.ctx.strokeStyle = '#ff0000';
        this.pipes.forEach(pipe => {
          const topBounds = pipe.getTopPipeBounds();
          const bottomBounds = pipe.getBottomPipeBounds();
          this.ctx.strokeRect(topBounds.x, topBounds.y, topBounds.width, topBounds.height);
          this.ctx.strokeRect(bottomBounds.x, bottomBounds.y, bottomBounds.width, bottomBounds.height);
        });

        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.beginPath();
        this.ctx.moveTo(0, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT);
        this.ctx.lineTo(CONFIG.WIDTH, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('DEBUG MODE (H to toggle)', 10, 10);
        if (this.bird) {
          this.ctx.fillText(`Bird Y: ${Math.round(this.bird.y)}`, 10, 30);
          this.ctx.fillText(`Velocity: ${Math.round(this.bird.velocity)}`, 10, 50);
        }
      }
    }

    this.ctx.restore();
  },
};


window.TappyGame = TappyGame;
window.cheat = () => TappyGame.cheat();
window.disablecheat = () => TappyGame.disablecheat();
