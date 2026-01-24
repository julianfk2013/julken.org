const Background = {
  stars: {
    far: [],
    mid: [],
    near: [],
  },

  width: 0,
  height: 0,

  scrollSpeed: 1.0,

  meteors: [],
  meteorSpawnTimer: 0,
  meteorSpawnInterval: 3,

  dust: [],

  nebulae: [],

  asteroids: [],
  stations: [],
  lightningBolts: [],
  solarFlare: null,
  energyWaves: [],

  init(width, height) {
    this.width = width;
    this.height = height;

    this.generateStars('far', 100, 1, 0.4, 0.3);
    this.generateStars('mid', 60, 1.5, 0.6, 0.8);
    this.generateStars('near', 30, 2, 0.9, 1.5);

    for (let i = 0; i < 80; i++) {
      this.dust.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.3 + 0.1,
        alpha: Math.random() * 0.2 + 0.1,
        drift: Math.random() * 20 - 10
      });
    }

    for (let i = 0; i < 5; i++) {
      this.nebulae.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 80 + Math.random() * 120,
        color: ['#1e40af', '#7c3aed', '#be185d'][Math.floor(Math.random() * 3)],
        alpha: 0.05 + Math.random() * 0.08,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.3 + Math.random() * 0.5
      });
    }

    for (let i = 0; i < 15; i++) {
      this.asteroids.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 2 + Math.random() * 6,
        speed: 20 + Math.random() * 40,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 2
      });
    }

    if (Math.random() < 0.5) {
      this.stations.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.5,
        size: 30 + Math.random() * 30,
        blink: 0,
        lights: []
      });

      for (let i = 0; i < 5; i++) {
        this.stations[0].lights.push({
          x: (Math.random() - 0.5) * this.stations[0].size,
          y: (Math.random() - 0.5) * this.stations[0].size,
          color: Math.random() < 0.5 ? '#22c55e' : '#ef4444',
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  },

  generateStars(layer, count, size, alpha, speed) {
    this.stars[layer] = [];

    for (let i = 0; i < count; i++) {
      this.stars[layer].push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: size + Math.random() * size * 0.5,
        baseAlpha: alpha,
        alpha: alpha,
        speed: speed,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 1.0,
      });
    }
  },

  generateLightningPath(x1, y1, x2, y2, segments) {
    const points = [{x: x1, y: y1}];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      points.push({
        x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 40,
        y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20
      });
    }
    points.push({x: x2, y: y2});
    return points;
  },

  update(dt) {
    const scrollMultiplier = this.scrollSpeed;

    ['far', 'mid', 'near'].forEach(layer => {
      this.stars[layer].forEach(star => {
        star.y += star.speed * scrollMultiplier * dt * 60;
        star.twinkle += star.twinkleSpeed * dt;

        star.alpha = star.baseAlpha * (0.7 + 0.3 * Math.sin(star.twinkle));

        if (star.y > this.height) {
          star.y = 0;
          star.x = Math.random() * this.width;
        }
      });
    });

    this.dust.forEach(particle => {
      particle.y += particle.speed * scrollMultiplier * dt * 30;
      particle.x += Math.sin(particle.y * 0.01) * particle.drift * dt;

      if (particle.y > this.height) {
        particle.y = 0;
        particle.x = Math.random() * this.width;
      }
      if (particle.x < 0) particle.x = this.width;
      if (particle.x > this.width) particle.x = 0;
    });

    this.nebulae.forEach(nebula => {
      nebula.pulsePhase += nebula.pulseSpeed * dt;
    });

    this.meteorSpawnTimer += dt;
    if (this.meteorSpawnTimer >= this.meteorSpawnInterval) {
      this.meteorSpawnTimer = 0;
      this.meteors.push({
        x: Math.random() * this.width * 0.4,
        y: -20,
        vx: 200 + Math.random() * 150,
        vy: 150 + Math.random() * 100,
        size: 3 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 4,
        life: 0,
        maxLife: 3.5,
        trail: []
      });
    }

    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.rotation += m.rotationSpeed * dt;
      m.life += dt;

      m.trail.push({ x: m.x, y: m.y, alpha: 1 });
      if (m.trail.length > 15) m.trail.shift();

      m.trail.forEach(t => { t.alpha -= dt * 1.5; });
      m.trail = m.trail.filter(t => t.alpha > 0);

      if (m.life > m.maxLife || m.x > this.width + 50 || m.y > this.height + 50) {
        this.meteors.splice(i, 1);
      }
    }

    this.asteroids.forEach(ast => {
      ast.y += ast.speed * scrollMultiplier * dt;
      ast.rotation += ast.rotationSpeed * dt;
      if (ast.y > this.height) {
        ast.y = 0;
        ast.x = Math.random() * this.width;
      }
    });

    this.stations.forEach(station => {
      station.blink += dt * 3;
      station.lights.forEach(light => {
        light.phase += dt * 2;
      });
    });

    if (Math.random() < 0.005) {
      const startX = Math.random() * this.width;
      const startY = 0;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = Math.random() * this.height * 0.4;

      this.lightningBolts.push({
        points: this.generateLightningPath(startX, startY, endX, endY, 5),
        life: 0.2,
        color: '#38bdf8'
      });
    }

    this.lightningBolts = this.lightningBolts.filter(bolt => {
      bolt.life -= dt;
      return bolt.life > 0;
    });

    if (!this.solarFlare && Math.random() < 0.002) {
      this.solarFlare = {
        x: Math.random() < 0.5 ? -100 : this.width + 100,
        y: Math.random() * this.height,
        life: 3,
        maxLife: 3,
        direction: Math.random() < 0.5 ? 1 : -1
      };
    }

    if (this.solarFlare) {
      this.solarFlare.life -= dt;
      if (this.solarFlare.life <= 0) {
        this.solarFlare = null;
      }
    }

    if (Math.random() < 0.003) {
      this.energyWaves.push({
        y: -50,
        speed: 150,
        amplitude: 10 + Math.random() * 15,
        frequency: 0.015 + Math.random() * 0.02,
        color: ['#38bdf8', '#8b5cf6', '#22c55e'][Math.floor(Math.random() * 3)],
        life: 2
      });
    }

    this.energyWaves = this.energyWaves.filter(wave => {
      wave.y += wave.speed * dt;
      wave.life -= dt;
      return wave.y < this.height + 50 && wave.life > 0;
    });
  },

  draw(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#000814');
    gradient.addColorStop(0.5, '#001d3d');
    gradient.addColorStop(1, '#000814');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    this.nebulae.forEach(nebula => {
      const pulse = Math.sin(nebula.pulsePhase) * 0.3 + 0.7;
      const nebulaGradient = ctx.createRadialGradient(
        nebula.x, nebula.y, 0,
        nebula.x, nebula.y, nebula.radius
      );
      const alpha = Math.min(255, Math.max(0, Math.floor(nebula.alpha * pulse * 255)));
      const alphaHex = alpha.toString(16).padStart(2, '0');
      nebulaGradient.addColorStop(0, `${nebula.color}${alphaHex}`);
      nebulaGradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = nebulaGradient;
      ctx.beginPath();
      ctx.arc(nebula.x, nebula.y, nebula.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
    });

    this.dust.forEach(particle => {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = '#8b9dc3';
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;

    this.stars.far.forEach(star => {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    this.stars.mid.forEach(star => {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    this.stars.near.forEach(star => {
      ctx.globalAlpha = star.alpha;
      ctx.shadowBlur = 2;
      ctx.shadowColor = 'white';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    this.meteors.forEach(m => {
      const alpha = 1 - (m.life / m.maxLife);

      for (let i = 0; i < m.trail.length - 1; i++) {
        const t = m.trail[i];
        const nextT = m.trail[i + 1];
        const trailAlpha = t.alpha * alpha * 0.6;

        ctx.strokeStyle = `rgba(200, 180, 255, ${trailAlpha})`;
        ctx.lineWidth = m.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(nextT.x, nextT.y);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rotation);
      ctx.globalAlpha = alpha;

      ctx.fillStyle = '#e0d5ff';
      ctx.beginPath();
      ctx.arc(0, 0, m.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 8;
      ctx.shadowColor = '#c4b5fd';
      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.arc(0, 0, m.size * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    this.asteroids.forEach(ast => {
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rotation);
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(-ast.size / 2, -ast.size / 2, ast.size, ast.size);
      ctx.restore();
    });

    this.stations.forEach(station => {
      ctx.save();

      ctx.fillStyle = '#374151';
      ctx.fillRect(station.x - station.size / 2, station.y - 3, station.size, 6);
      ctx.fillRect(station.x - 3, station.y - station.size / 2, 6, station.size);

      station.lights.forEach(light => {
        const alpha = Math.sin(light.phase) * 0.5 + 0.5;
        ctx.fillStyle = light.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(station.x + light.x, station.y + light.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.restore();
    });

    this.lightningBolts.forEach(bolt => {
      ctx.save();
      ctx.strokeStyle = bolt.color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = bolt.color;
      ctx.globalAlpha = bolt.life / 0.2;

      ctx.beginPath();
      ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let i = 1; i < bolt.points.length; i++) {
        ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
      }
      ctx.stroke();

      ctx.restore();
    });

    if (this.solarFlare) {
      const progress = 1 - (this.solarFlare.life / this.solarFlare.maxLife);
      const fadeIn = Math.min(progress * 3, 1);
      const fadeOut = Math.max(1 - (progress - 0.7) * 3, 0);
      const alpha = Math.min(fadeIn, fadeOut);

      const grad = ctx.createRadialGradient(
        this.solarFlare.x, this.solarFlare.y, 0,
        this.solarFlare.x, this.solarFlare.y, 400
      );
      grad.addColorStop(0, `rgba(251, 146, 60, ${alpha * 0.3})`);
      grad.addColorStop(0.5, `rgba(251, 146, 60, ${alpha * 0.1})`);
      grad.addColorStop(1, 'rgba(251, 146, 60, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    this.energyWaves.forEach(wave => {
      ctx.save();
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = (wave.life / 2) * 0.3;
      ctx.shadowBlur = 5;
      ctx.shadowColor = wave.color;

      ctx.beginPath();
      for (let x = 0; x <= this.width; x += 10) {
        const y = wave.y + Math.sin(x * wave.frequency) * wave.amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.restore();
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  },

  setScrollSpeed(speed) {
    this.scrollSpeed = speed;
  },

  resize(width, height) {
    this.width = width;
    this.height = height;
  }
};
