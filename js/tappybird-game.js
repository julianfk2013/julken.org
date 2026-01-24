
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

    
    console.log(`Canvas resized: Internal ${CONFIG.WIDTH}x${CONFIG.HEIGHT}, Display ${this.canvas.clientWidth}x${this.canvas.clientHeight}`);
  },

  setupInput() {
    
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      
      if (e.key.toLowerCase() === 'h') {
        this.debugMode = !this.debugMode;
        console.log(`🔍 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
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
    console.log('🎮 Starting game...');
    this.state = 'playing';
    this.score = 0;
    this.pipeSpawnTimer = 0;
    this.flashTimer = 0;
    this.scoreScale = 1;
    this.scoreAnimTimer = 0;
    this.scoreRotation = 0;

    this.bird = new Bird(CONFIG.BIRD_X, CONFIG.BIRD_START_Y);
    this.pipes = [];
    this.particles = [];

    TappyStorage.incrementGames();

    console.log('✅ Game started! Bird created at', CONFIG.BIRD_X, CONFIG.BIRD_START_Y);

    
    setTimeout(() => {
      if (this.state === 'playing') {
        console.log('Spawning first pipe...');
        this.spawnPipe();
      }
    }, 1000);
  },

  pause() {
    if (this.state === 'playing') {
      this.pausedState = 'playing';
      this.state = 'paused';
      AudioManager.pauseMusic();
      console.log('⏸ Game paused');
    }
  },

  resume() {
    if (this.state === 'paused' && this.pausedState === 'playing') {
      this.state = 'playing';
      this.pausedState = null;
      AudioManager.playMusic();
      console.log('▶ Game resumed');
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
    if (this.state !== 'playing' || this.state === 'paused') return;

    
    const speedMultiplier = Math.min(
      1 + (this.score * CONFIG.PIPE_SPEED_INCREASE) / CONFIG.PIPE_SPEED,
      CONFIG.PIPE_MAX_SPEED / CONFIG.PIPE_SPEED
    );

    Background.update(dt, speedMultiplier);

    
    this.bird.update(dt);

    
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
        
        this.scoreScale = 1.5;
        this.scoreAnimTimer = 300; 
      }

      return !pipe.destroyed;
    });

    
    this.particles = this.particles.filter(particle => {
      particle.update(dt);
      return !particle.dead;
    });

    
    this.checkCollisions();

    
    if (this.scoreAnimTimer > 0) {
      this.scoreAnimTimer -= dt * 1000;
      
      const progress = this.scoreAnimTimer / 300;
      this.scoreScale = 1 + (0.5 * progress);
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
    
    
    const random = Math.random();
    let gapY;

    if (random < 0.8) {
      
      const variation = (Math.random() - 0.5) * 2 * CONFIG.GAP_VARIATION;
      gapY = CONFIG.GAP_CENTER_Y - (CONFIG.PIPE_GAP / 2) + variation;
    } else if (random < 0.9) {
      
      const variation = -Math.random() * CONFIG.GAP_VARIATION;
      gapY = CONFIG.GAP_CENTER_Y - (CONFIG.PIPE_GAP / 2) + variation;
    } else {
      
      const variation = Math.random() * CONFIG.GAP_VARIATION;
      gapY = CONFIG.GAP_CENTER_Y - (CONFIG.PIPE_GAP / 2) + variation;
    }

    
    const minGapY = CONFIG.PIPE_MIN_HEIGHT;
    const maxGapY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - CONFIG.PIPE_GAP - CONFIG.PIPE_MIN_HEIGHT;
    gapY = Math.max(minGapY, Math.min(maxGapY, gapY));

    const pipe = new Pipe(CONFIG.WIDTH, gapY, CONFIG.PIPE_GAP);
    this.pipes.push(pipe);
    console.log(`🟢 Pipe spawned at gapY: ${Math.round(gapY)}, Total pipes: ${this.pipes.length}`);
  },

  checkCollisions() {
    
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

  rectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  },

  gameOver() {
    this.state = 'gameover';
    this.bird.dead = true;
    this.flashTimer = CONFIG.FLASH_DURATION;

    
    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / CONFIG.PARTICLE_COUNT;
      const speed = 200 + Math.random() * 100;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.particles.push(new Particle(
        this.bird.x + this.bird.width / 2,
        this.bird.y + this.bird.height / 2,
        vx,
        vy,
        COLORS.PARTICLE,
        4 + Math.random() * 4
      ));
    }

    
    if (this.score > TappyStorage.getHighScore()) {
      TappyStorage.setHighScore(this.score);
    }

    TappyStorage.addToTotalScore(this.score);

    AudioManager.playSound('die');

    
    TappyUI.showGameOver(this);
  },

  render() {
    
    this.ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    
    Background.draw(this.ctx);

    if (this.state === 'playing' || this.state === 'paused' || this.state === 'gameover') {
      
      this.pipes.forEach(pipe => pipe.draw(this.ctx));

      
      this.particles.forEach(particle => particle.draw(this.ctx));

      
      if (this.bird && !this.bird.dead) {
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
  },
};


window.TappyGame = TappyGame;
