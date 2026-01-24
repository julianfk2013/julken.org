


const Assets = {
  birdImg: null,
  pipeImg: null,
  cloudImg: null,

  setAssets(assets) {
    this.birdImg = assets.birdImg;
    this.pipeImg = assets.pipeImg;
    this.cloudImg = assets.cloudImg;
  }
};


const AudioManager = {
  sounds: {},
  music: null,
  settings: null,
  initialized: false,

  init() {
    this.settings = TappyStorage.getSettings();
    this.initialized = true;

    
    if (this.settings.muted) {
      if (this.music) {
        this.music.muted = true;
      }
      Object.values(this.sounds).forEach(sound => {
        if (sound) {
          sound.muted = true;
        }
      });
    }
  },

  loadSound(name, src) {
    if (!this.initialized) {
      this.init();
    }

    const audio = new Audio();
    audio.addEventListener('canplaythrough', () => {
      audio.volume = this.settings.sfxVolume;
      audio.muted = this.settings.muted || false;
      this.sounds[name] = audio;
    }, { once: true });

    audio.addEventListener('error', (e) => {
      console.error(`Failed to load sound: ${name} from ${src}`, e);
    });

    audio.src = src;
    audio.preload = 'auto';
  },

  loadMusic(src) {
    if (!this.initialized) {
      this.init();
    }

    this.music = new Audio(src);
    this.music.loop = true;
    this.music.volume = this.settings.musicVolume;
    this.music.muted = this.settings.muted || false;
    this.music.preload = 'auto';
  },

  playSound(name, pitchVariation = 0) {
    if (!this.sounds[name]) {
      console.warn(`Sound not loaded: ${name}`);
      return;
    }

    if (!this.initialized) {
      this.init();
    }

    try {
      const sound = this.sounds[name].cloneNode();

      
      sound.volume = this.settings.sfxVolume;
      sound.muted = this.settings.muted || false;

      if (pitchVariation) {
        sound.playbackRate = 1 + (Math.random() - 0.5) * pitchVariation;
      }

      sound.play().catch((e) => {
        console.error(`Failed to play sound: ${name}`, e.message);
      });
    } catch (e) {
      console.error(`Error playing sound: ${name}`, e);
    }
  },

  playMusic() {
    if (!this.music) return;
    this.music.play().catch((e) => {
      console.error('Failed to play music:', e.message);
    });
  },

  pauseMusic() {
    if (this.music) {
      this.music.pause();
    }
  },

  toggleMusic() {
    if (!this.music) return false;

    if (this.music.paused) {
      this.playMusic();
      return true;
    } else {
      this.pauseMusic();
      return false;
    }
  },

  setMusicVolume(volume) {
    this.settings.musicVolume = volume;
    if (this.music) {
      this.music.volume = volume;
    }
    TappyStorage.setSetting('musicVolume', volume);
  },

  setSFXVolume(volume) {
    this.settings.sfxVolume = volume;
    Object.values(this.sounds).forEach(sound => {
      sound.volume = volume;
    });
    TappyStorage.setSetting('sfxVolume', volume);
  },

  setVolume(volume) {
    if (!this.initialized) {
      this.init();
    }

    console.log(`🔊 Setting volume to ${Math.round(volume * 100)}%`);

    
    this.settings.sfxVolume = volume;
    this.settings.musicVolume = volume;

    
    if (this.music) {
      this.music.volume = volume;
      console.log(`Music volume set to ${volume}`);
    }

    
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.volume = volume;
      }
    });

    
    TappyStorage.setSetting('sfxVolume', volume);
    TappyStorage.setSetting('musicVolume', volume);
  },

  setMuted(muted) {
    if (!this.initialized) {
      this.init();
    }

    console.log(`🔇 Setting muted to ${muted}`);

    this.settings.muted = muted;

    
    if (this.music) {
      this.music.muted = muted;
    }

    
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.muted = muted;
      }
    });

    
    TappyStorage.setSetting('muted', muted);
  },
};


class Bird {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = CONFIG.BIRD_SIZE;
    this.height = CONFIG.BIRD_SIZE;
    this.velocity = 0;
    this.rotation = 0;
    this.dead = false;
  }

  update(dt) {
    
    this.velocity += CONFIG.GRAVITY * dt;

    
    if (this.velocity > CONFIG.MAX_FALL_SPEED) {
      this.velocity = CONFIG.MAX_FALL_SPEED;
    }

    
    this.y += this.velocity * dt;

    
    this.rotation = Math.min(Math.max(this.velocity / 500 * 45, -30), 90);
  }

  flap() {
    this.velocity = CONFIG.FLAP_STRENGTH;
    AudioManager.playSound('flap', 0.1);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate((this.rotation * Math.PI) / 180);

    if (Assets.birdImg && Assets.birdImg.complete) {
      
      ctx.drawImage(Assets.birdImg, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      
      const gradient = ctx.createRadialGradient(0, -5, 5, 0, 0, this.width / 2);
      gradient.addColorStop(0, COLORS.BIRD);
      gradient.addColorStop(1, COLORS.BIRD_ACCENT);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
      ctx.fill();

      
      ctx.strokeStyle = COLORS.BIRD_ACCENT;
      ctx.lineWidth = 2;
      ctx.stroke();

      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(8, -5, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(10, -4, 3, 0, Math.PI * 2);
      ctx.fill();

      
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(24, -2);
      ctx.lineTo(24, 2);
      ctx.closePath();
      ctx.fill();

      
      ctx.fillStyle = COLORS.BIRD_WING;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.ellipse(-5, 5, 10, 6, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  getBounds() {
    
    const padding = CONFIG.BIRD_HITBOX_PADDING;
    return {
      x: this.x + padding,
      y: this.y + padding,
      width: this.width - padding * 2,
      height: this.height - padding * 2,
    };
  }
}


class Pipe {
  constructor(x, gapY, gapHeight) {
    this.x = x;
    this.gapY = gapY;
    this.gapHeight = gapHeight;
    this.width = CONFIG.PIPE_WIDTH;
    this.scored = false;
    this.destroyed = false;

    
    this.topPipe = {
      x: this.x,
      y: 0,
      width: this.width,
      height: this.gapY,
    };

    
    this.bottomPipe = {
      x: this.x,
      y: this.gapY + this.gapHeight,
      width: this.width,
      height: CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - (this.gapY + this.gapHeight),
    };

    console.log(`Pipe created: top height=${this.topPipe.height}, gap at y=${gapY}, bottom start=${this.bottomPipe.y}, bottom height=${this.bottomPipe.height}, pipe width=${this.width}`);
  }

  update(dt, speed = CONFIG.PIPE_SPEED) {
    this.x -= speed * dt;
    this.topPipe.x = this.x;
    this.bottomPipe.x = this.x;

    
    if (this.x + this.width < 0) {
      this.destroyed = true;
    }
  }

  draw(ctx) {
    this.drawPipeSegment(ctx, this.topPipe, true);
    this.drawPipeSegment(ctx, this.bottomPipe, false);
  }

  drawPipeSegment(ctx, pipe, isTop) {
    if (Assets.pipeImg && Assets.pipeImg.complete) {
      ctx.save();

      if (isTop) {
        
        const centerX = pipe.x + pipe.width / 2;
        const centerY = pipe.y + pipe.height / 2;

        ctx.translate(centerX, centerY);
        ctx.rotate(Math.PI); 
        ctx.drawImage(
          Assets.pipeImg,
          -pipe.width / 2,
          -pipe.height / 2,
          pipe.width,
          pipe.height
        );
      } else {
        
        ctx.drawImage(
          Assets.pipeImg,
          pipe.x,
          pipe.y,
          pipe.width,
          pipe.height
        );
      }

      ctx.restore();
    } else {
      
      const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
      gradient.addColorStop(0, COLORS.PIPE_SHADOW);
      gradient.addColorStop(0.3, COLORS.PIPE);
      gradient.addColorStop(0.7, COLORS.PIPE_HIGHLIGHT);
      gradient.addColorStop(1, COLORS.PIPE_SHADOW);

      ctx.fillStyle = gradient;
      ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);

      
      const capHeight = 30;
      const capWidth = pipe.width + 8;
      const capX = pipe.x - 4;
      const capY = isTop ? pipe.y + pipe.height - capHeight : pipe.y;

      ctx.fillStyle = COLORS.PIPE;
      ctx.fillRect(capX, capY, capWidth, capHeight);

      
      ctx.fillStyle = COLORS.PIPE_HIGHLIGHT;
      ctx.fillRect(capX + 2, capY + 4, capWidth - 4, 4);

      
      ctx.strokeStyle = COLORS.PIPE_OUTLINE;
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);
      ctx.strokeRect(capX, capY, capWidth, capHeight);
    }
  }

  getTopPipeBounds() {
    
    const verticalPadding = CONFIG.PIPE_HITBOX_PADDING || 0;
    const horizontalPadding = CONFIG.PIPE_HITBOX_HORIZONTAL_PADDING || 0;
    return {
      x: this.topPipe.x + horizontalPadding,
      y: this.topPipe.y + verticalPadding,
      width: Math.max(0, this.topPipe.width - horizontalPadding * 2),
      height: Math.max(0, this.topPipe.height - verticalPadding)
    };
  }

  getBottomPipeBounds() {
    
    const verticalPadding = CONFIG.PIPE_HITBOX_PADDING_BOTTOM || 0;
    const horizontalPadding = CONFIG.PIPE_HITBOX_HORIZONTAL_PADDING || 0;
    return {
      x: this.bottomPipe.x + horizontalPadding,
      y: this.bottomPipe.y,
      width: Math.max(0, this.bottomPipe.width - horizontalPadding * 2),
      height: Math.max(0, this.bottomPipe.height - verticalPadding)
    };
  }
}


class Particle {
  constructor(x, y, vx, vy, color, size, lifetime = CONFIG.PARTICLE_LIFETIME) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += CONFIG.GRAVITY * dt * 0.5; 
    this.age += dt * 1000;

    if (this.age >= this.lifetime) {
      this.dead = true;
    }
  }

  draw(ctx) {
    const alpha = 1 - (this.age / this.lifetime);
    ctx.fillStyle = this.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
  }
}


const Background = {
  groundOffset: 0,
  clouds: [],
  birds: [],
  stars: [],
  cycleTime: 0, 

  init() {
    this.cycleTime = 0;
    
    this.clouds = [];
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * CONFIG.WIDTH,
        y: Math.random() * (CONFIG.HEIGHT * 0.5),
        width: 40 + Math.random() * 60,
        height: 20 + Math.random() * 30,
        speed: 15 + Math.random() * 25,
        alpha: 0.5 + Math.random() * 0.3,
      });
    }

    
    this.stars = [];
    for (let i = 0; i < 30; i++) {
      this.stars.push({
        x: Math.random() * CONFIG.WIDTH,
        y: Math.random() * (CONFIG.HEIGHT * 0.7),
        size: 1 + Math.random() * 2.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.5, 
      });
    }
  },

  update(dt, speedMultiplier = 1) {
    
    this.cycleTime += dt;

    
    this.groundOffset -= CONFIG.GROUND_SCROLL_SPEED * dt * speedMultiplier;
    if (this.groundOffset <= -50) {
      this.groundOffset = 0;
    }

    
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed * dt * speedMultiplier;
      if (cloud.x + cloud.width < 0) {
        cloud.x = CONFIG.WIDTH;
        cloud.y = Math.random() * (CONFIG.HEIGHT * 0.5);
      }
    });

    
    this.stars.forEach(star => {
      star.twinkle += dt * (3 + star.speed);
    });
  },

  draw(ctx, score = 0) {
    
    const cycleDuration = 30; 
    const cyclePosition = (this.cycleTime % cycleDuration) / cycleDuration; 

    
    const nightness = (1 - Math.cos(cyclePosition * Math.PI * 2)) / 2;

    
    const dayTopColor = { r: 120, g: 217, b: 224 }; 
    const dayBottomColor = { r: 78, g: 192, b: 202 }; 
    const nightTopColor = { r: 25, g: 25, b: 60 };   
    const nightBottomColor = { r: 50, g: 50, b: 100 }; 

    
    const topColor = {
      r: Math.round(dayTopColor.r + (nightTopColor.r - dayTopColor.r) * nightness),
      g: Math.round(dayTopColor.g + (nightTopColor.g - dayTopColor.g) * nightness),
      b: Math.round(dayTopColor.b + (nightTopColor.b - dayTopColor.b) * nightness)
    };

    const bottomColor = {
      r: Math.round(dayBottomColor.r + (nightBottomColor.r - dayBottomColor.r) * nightness),
      g: Math.round(dayBottomColor.g + (nightBottomColor.g - dayBottomColor.g) * nightness),
      b: Math.round(dayBottomColor.b + (nightBottomColor.b - dayBottomColor.b) * nightness)
    };

    
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CONFIG.HEIGHT);
    skyGradient.addColorStop(0, `rgb(${topColor.r}, ${topColor.g}, ${topColor.b})`);
    skyGradient.addColorStop(1, `rgb(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b})`);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    
    const nightAlpha = nightness;
    if (nightAlpha > 0.2) { 
      this.stars.forEach(star => {
        const alpha = (0.4 + Math.sin(star.twinkle) * 0.4) * nightAlpha;
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;

        
        const half = star.size / 2;
        ctx.fillRect(star.x - half, star.y - half, star.size, star.size);

        
        if (star.size > 2) {
          const sparkle = Math.sin(star.twinkle * 2) * 0.3 * nightAlpha;
          ctx.fillStyle = `rgba(255, 255, 255, ${sparkle})`;
          ctx.fillRect(star.x - half - 1, star.y, 1, 1);
          ctx.fillRect(star.x + half, star.y, 1, 1);
          ctx.fillRect(star.x, star.y - half - 1, 1, 1);
          ctx.fillRect(star.x, star.y + half, 1, 1);
        }
      });
    }

    
    this.clouds.forEach(cloud => {
      if (Assets.cloudImg && Assets.cloudImg.complete) {
        ctx.globalAlpha = cloud.alpha || 0.7;
        ctx.drawImage(Assets.cloudImg, cloud.x, cloud.y, cloud.width, cloud.height);
        ctx.globalAlpha = 1;
      } else {
        
        ctx.fillStyle = `rgba(255, 255, 255, ${cloud.alpha || 0.6})`;
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(cloud.x + cloud.width * 0.3, cloud.y - cloud.height * 0.2, cloud.width / 3, cloud.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(cloud.x + cloud.width * 0.5, cloud.y, cloud.width / 2.5, cloud.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;

    
    ctx.fillStyle = COLORS.GROUND;
    ctx.fillRect(0, groundY, CONFIG.WIDTH, CONFIG.GROUND_HEIGHT);

    
    ctx.fillStyle = COLORS.GROUND_ACCENT;
    for (let x = this.groundOffset; x < CONFIG.WIDTH; x += 50) {
      ctx.fillRect(x, groundY, 30, 15);
    }

    
    ctx.fillStyle = COLORS.GROUND_GRASS;
    ctx.fillRect(0, groundY, CONFIG.WIDTH, 8);
  },
};
