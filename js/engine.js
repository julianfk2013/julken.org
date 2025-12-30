// Galactic Breakout DELUXE - Game Engine
// Physics, Particles, Audio, and Asset Management

// ===== Particle System =====
class Particle {
  constructor(x, y, vx, vy, color, size, lifetime = 1000) {
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
    this.vy += CONFIG.GRAVITY * dt; // Apply gravity
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

const ParticleSystem = {
  particles: [],

  createExplosion(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 100 + Math.random() * 100;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 3 + Math.random() * 3;
      this.particles.push(new Particle(x, y, vx, vy, color, size, 800));
    }
  },

  createBurst(x, y, color, count = 30) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 100; // Upward bias
      const size = 2 + Math.random() * 4;
      this.particles.push(new Particle(x, y, vx, vy, color, size, 1000));
    }
  },

  createTrail(x, y, color, size = 6) {
    this.particles.push(new Particle(x, y, 0, 0, color, size, 300));
  },

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].dead) {
        this.particles.splice(i, 1);
      }
    }
  },

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  },

  clear() {
    this.particles = [];
  },
};

// ===== Physics Engine =====
const Physics = {
  // Circle-Rectangle collision (ball-brick)
  circleRectCollision(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    const distX = circle.x - closestX;
    const distY = circle.y - closestY;
    const distSq = distX * distX + distY * distY;
    return distSq < circle.radius * circle.radius;
  },

  // Rectangle-Rectangle collision (AABB)
  rectRectCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  },

  // Point-Rectangle collision
  pointRectCollision(point, rect) {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  },

  // Reflect velocity off surface
  reflect(velocity, normal) {
    const dot = velocity.x * normal.x + velocity.y * normal.y;
    return {
      x: velocity.x - 2 * dot * normal.x,
      y: velocity.y - 2 * dot * normal.y,
    };
  },

  // Calculate bounce angle based on paddle hit position
  calculateBounceAngle(ballX, paddleX, paddleWidth) {
    const relativeIntersect = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
    const bounceAngle = relativeIntersect * (CONFIG.BALL_MAX_ANGLE * Math.PI / 180);
    return bounceAngle;
  },

  // Normalize vector
  normalize(vec) {
    const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: vec.x / mag, y: vec.y / mag };
  },

  // Distance between two points
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Clamp value between min and max
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },
};

// ===== Audio Manager =====
const AudioManager = {
  sounds: {},
  music: null,
  settings: null,
  initialized: false,
  filesLoaded: 0,
  totalFiles: 0,

  init() {
    // Production: console.log removed
    this.settings = Storage.getSettings();
    this.initialized = true;
  },

  loadSound(name, src) {
    if (!this.initialized) {
      console.error('❌ AudioManager.init() must be called before loading sounds!');
      this.init(); // Auto-init if forgotten
    }

    this.totalFiles++;
    const audio = new Audio();

    audio.addEventListener('canplaythrough', () => {
      this.filesLoaded++;
      // Production: console.log removed
      audio.volume = this.settings.sfxVolume;
      this.sounds[name] = audio;
    }, { once: true });

    audio.addEventListener('error', (e) => {
      console.error(`❌ Failed to load sound: ${name} from ${src}`, e);
      console.error('   Check if file exists:', src);
      this.filesLoaded++;
    });

    audio.src = src;
    audio.preload = 'auto';
  },

  loadMusic(src) {
    if (!this.initialized) {
      console.error('❌ AudioManager.init() must be called before loading music!');
      this.init(); // Auto-init if forgotten
    }

    this.totalFiles++;
    this.music = new Audio(src);
    this.music.loop = true;
    this.music.volume = this.settings.musicVolume;

    this.music.addEventListener('canplaythrough', () => {
      this.filesLoaded++;
      // Production: console.log removed
    }, { once: true });

    this.music.addEventListener('error', (e) => {
      console.error(`❌ Failed to load music from ${src}`, e);
      console.error('   Check if file exists:', src);
      this.filesLoaded++;
    });

    this.music.preload = 'auto';
  },

  playSound(name, pitchVariation = 0) {
    if (!this.sounds[name]) {
      console.warn(`⚠️ Sound not loaded: ${name}`);
      return;
    }

    try {
      const sound = this.sounds[name].cloneNode();
      sound.volume = this.settings?.sfxVolume || 0.7;

      if (pitchVariation) {
        sound.playbackRate = 1 + (Math.random() - 0.5) * pitchVariation;
      }

      sound.play()
        .catch((e) => {
          console.error(`❌ Failed to play sound: ${name}`, e.message);
          if (e.name === 'NotAllowedError') {
            console.error('   → User interaction required. Click anywhere first.');
          }
        });
    } catch (e) {
      console.error(`❌ Error playing sound: ${name}`, e);
    }
  },

  playMusic() {
    if (!this.music) {
      console.warn('⚠️ Music not loaded');
      return;
    }

    this.music.play()
      .then(() => {}) // Production: console.log removed
      .catch((e) => {
        console.error('❌ Failed to play music:', e.message);
        if (e.name === 'NotAllowedError') {
          console.error('   → User interaction required. Click anywhere first.');
        }
      });
  },

  pauseMusic() {
    if (this.music) {
      this.music.pause();
      // Production: console.log removed
    }
  },

  toggleMusic() {
    if (!this.music) {
      console.warn('⚠️ Music not loaded');
      return false;
    }

    if (this.music.paused) {
      this.playMusic();
      return true; // Music is now playing
    } else {
      this.pauseMusic();
      return false; // Music is now paused
    }
  },

  setMusicVolume(volume) {
    if (!this.settings) {
      this.settings = Storage.getSettings();
    }
    this.settings.musicVolume = volume;
    if (this.music) {
      this.music.volume = volume;
    }
    Storage.setSetting('musicVolume', volume);
    // Production: console.log removed
  },

  setSFXVolume(volume) {
    if (!this.settings) {
      this.settings = Storage.getSettings();
    }
    this.settings.sfxVolume = volume;
    Object.values(this.sounds).forEach(sound => {
      sound.volume = volume;
    });
    Storage.setSetting('sfxVolume', volume);
    // Production: console.log removed
  },

  // Diagnostic method
  getStatus() {
    // Production: console.log removed (diagnostic method)
    return {
      initialized: this.initialized,
      filesLoaded: this.filesLoaded,
      totalFiles: this.totalFiles,
      settings: this.settings,
      soundsLoaded: Object.keys(this.sounds),
      musicLoaded: !!this.music
    };
  }
};

// ===== Asset Loader =====
// NOTE: AssetLoader is now defined in galacticassault-assets.js
// This old implementation is commented out to avoid conflicts
/*
const AssetLoader = {
  images: {},
  loaded: 0,
  total: 0,

  loadImage(name, src) {
    this.total++;
    const img = new Image();
    img.onload = () => {
      this.loaded++;
      this.images[name] = img;
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      this.loaded++;
    };
    img.src = src;
  },

  getImage(name) {
    return this.images[name] || null;
  },

  isReady() {
    return this.loaded >= this.total;
  },

  getProgress() {
    return this.total > 0 ? this.loaded / this.total : 1;
  },
};
*/

// ===== Background Effects =====
const BackgroundEffects = {
  stars: [],
  meteors: [],
  time: 0,

  init(width, height) {
    // Create starfield (3 layers for parallax)
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        layer: Math.floor(Math.random() * 3), // 0, 1, 2
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  },

  update(dt, width, height) {
    this.time += dt;

    // Update stars
    this.stars.forEach(star => {
      star.x -= star.speed * star.layer * 20 * dt;
      if (star.x < -10) {
        star.x = width + 10;
        star.y = Math.random() * height;
      }
      star.twinkle += dt * 2;
    });

    // Spawn meteors randomly
    if (Math.random() < 0.002) {
      this.meteors.push({
        x: Math.random() * width * 0.3,
        y: -20,
        vx: 500 + Math.random() * 200,
        vy: 350,
        life: 0,
        maxLife: 1.5,
      });
    }

    // Update meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.life += dt;
      if (m.life > m.maxLife || m.x > width + 50 || m.y > height + 50) {
        this.meteors.splice(i, 1);
      }
    }
  },

  draw(ctx, width, height) {
    // Draw stars
    this.stars.forEach(star => {
      const alpha = 0.3 + Math.sin(star.twinkle) * 0.3;
      const brightness = 200 + Math.sin(star.twinkle) * 55;
      ctx.fillStyle = `rgba(${brightness}, ${brightness}, 255, ${alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Draw meteors
    this.meteors.forEach(m => {
      const alpha = 1 - m.life / m.maxLife;
      const gradient = ctx.createLinearGradient(m.x, m.y, m.x - 80, m.y - 80 * (m.vy / m.vx));
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - 80, m.y - 80 * (m.vy / m.vx));
      ctx.stroke();
    });
  },
};

// ===== Screen Shake =====
const ScreenShake = {
  intensity: 0,
  duration: 0,

  shake(intensity = 5, duration = 200) {
    this.intensity = intensity;
    this.duration = duration;
  },

  update(dt) {
    if (this.duration > 0) {
      this.duration -= dt * 1000;
      if (this.duration <= 0) {
        this.intensity = 0;
      }
    }
  },

  getOffset() {
    if (this.intensity === 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.intensity,
      y: (Math.random() - 0.5) * this.intensity,
    };
  },
};
