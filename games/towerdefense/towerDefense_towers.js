// Tower system - all tower types and logic

class Tower {
  constructor(gridX, gridY, type) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;
    this.level = 0; // 0-2 (upgrades)

    const pos = PathFinder.gridToPixel(gridX, gridY);
    this.x = pos.x;
    this.y = pos.y;

    this.stats = TOWER_STATS[type];
    this.target = null;
    this.cooldown = 0;
    this.rotation = 0;
  }

  getStats() {
    return {
      damage: this.stats.damage[this.level],
      range: this.stats.range[this.level],
      fireRate: this.stats.fireRate[this.level],
      cost: this.stats.cost[this.level]
    };
  }

  getSellValue() {
    let total = 0;
    for (let i = 0; i <= this.level; i++) {
      total += this.stats.cost[i];
    }
    return Math.floor(total * 0.6); // 60% refund
  }

  canUpgrade() {
    return this.level < 2;
  }

  getUpgradeCost() {
    if (!this.canUpgrade()) return 0;
    return this.stats.cost[this.level + 1];
  }

  upgrade() {
    if (this.canUpgrade()) {
      this.level++;
      return true;
    }
    return false;
  }

  findTarget(enemies) {
    const stats = this.getStats();
    let closest = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
      const dist = PathFinder.distance(this.x, this.y, enemy.x, enemy.y);
      if (dist <= stats.range && dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }

    return closest;
  }

  update(dt, enemies, projectiles, particles) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.firedThisFrame = false;

    if (this.cooldown <= 0) {
      this.target = this.findTarget(enemies);

      if (this.target) {
        this.fire(projectiles, particles);
        const stats = this.getStats();
        this.cooldown = stats.fireRate;
        this.firedThisFrame = true;

        // Update rotation to face target
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        this.rotation = Math.atan2(dy, dx);
      }
    }
  }

  fire(projectiles, particles) {
    const stats = this.getStats();

    // Calculate barrel position for muzzle flash
    const barrelLength = CONFIG.TILE_SIZE * 0.5;
    const barrelX = this.x + Math.cos(this.rotation) * barrelLength;
    const barrelY = this.y + Math.sin(this.rotation) * barrelLength;

    // Create muzzle flash particles
    for (let i = 0; i < 5; i++) {
      const angle = this.rotation + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 50 + 30;
      particles.push(new Particle(
        barrelX,
        barrelY,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.2,
        this.stats.color
      ));
    }

    if (this.type === 'laser') {
      projectiles.push(new LaserProjectile(this.x, this.y, this.target, stats.damage));
    } else if (this.type === 'rocket') {
      const areaRadius = this.stats.areaRadius[this.level];
      projectiles.push(new RocketProjectile(this.x, this.y, this.target, stats.damage, areaRadius));
    } else if (this.type === 'plasma') {
      const slowAmount = this.stats.slowAmount[this.level];
      projectiles.push(new PlasmaProjectile(this.x, this.y, this.target, stats.damage, slowAmount));
    } else if (this.type === 'tesla') {
      const chainCount = this.stats.chainCount[this.level];
      projectiles.push(new TeslaProjectile(this.x, this.y, this.target, stats.damage, chainCount));
    } else if (this.type === 'sniper') {
      projectiles.push(new SniperProjectile(this.x, this.y, this.target, stats.damage));
    } else if (this.type === 'flame') {
      const dotDamage = this.stats.dotDamage[this.level];
      const dotDuration = this.stats.dotDuration;
      projectiles.push(new FlameProjectile(this.x, this.y, this.target, stats.damage, dotDamage, dotDuration));
    } else if (this.type === 'railgun') {
      const pierceCount = this.stats.pierceCount[this.level];
      projectiles.push(new RailgunProjectile(this.x, this.y, this.target, stats.damage, pierceCount, stats.range));
    } else if (this.type === 'freeze') {
      const slowAmount = this.stats.slowAmount[this.level];
      const slowDuration = this.stats.slowDuration[this.level];
      projectiles.push(new FreezeProjectile(this.x, this.y, this.target, stats.damage, slowAmount, slowDuration));
    } else if (this.type === 'annihilator') {
      // THE ULTIMATE WEAPON - fires everything at once
      const areaRadius = this.stats.areaRadius[this.level];
      const chainCount = this.stats.chainCount[this.level];
      const slowAmount = this.stats.slowAmount[this.level];
      const slowDuration = this.stats.slowDuration;
      projectiles.push(new AnnihilatorProjectile(
        this.x, this.y, this.target, stats.damage,
        areaRadius, chainCount, slowAmount, slowDuration, stats.range
      ));
      // Screen shake effect via extra particles
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 200 + 100;
        particles.push(new Particle(
          this.x, this.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.5,
          ['#ff0000', '#ff6600', '#ffff00', '#ffffff'][Math.floor(Math.random() * 4)]
        ));
      }
    }
  }

  draw(ctx) {
    const size = CONFIG.TILE_SIZE * 0.7;
    const time = performance.now() / 1000;

    // SPECIAL ANNIHILATOR RENDERING
    if (this.type === 'annihilator') {
      this.drawAnnihilator(ctx, size, time);
      return;
    }

    // Draw vibrant base platform with 3D effect
    const baseGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 0.7);
    baseGradient.addColorStop(0, 'rgba(100,120,150,0.9)');
    baseGradient.addColorStop(0.7, 'rgba(60,80,110,0.8)');
    baseGradient.addColorStop(1, 'rgba(30,40,60,0.6)');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Shadow beneath tower
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + size * 0.7, size * 0.5, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw charging indicator (pulses when ready to fire)
    const cooldownPercent = 1 - (this.cooldown / this.getStats().fireRate);
    if (cooldownPercent > 0.7) {
      const pulse = Math.sin(time * 8) * 0.5 + 0.5;
      ctx.strokeStyle = this.stats.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = this.stats.color;
      ctx.shadowBlur = 20 * pulse;
      ctx.globalAlpha = pulse * 0.7;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // Draw tower body
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Main body with vibrant gradient
    const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size/2);
    bodyGradient.addColorStop(0, this.stats.color);
    bodyGradient.addColorStop(0.6, this.stats.color);
    bodyGradient.addColorStop(1, this.stats.color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
    ctx.fillStyle = bodyGradient;

    // Hexagonal body
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * size/3;
      const y = Math.sin(angle) * size/3;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Glowing edge
    ctx.strokeStyle = this.stats.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = this.stats.color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Barrel with gradient
    const barrelGradient = ctx.createLinearGradient(size/3, 0, size, 0);
    barrelGradient.addColorStop(0, this.stats.color);
    barrelGradient.addColorStop(0.8, this.stats.color);
    barrelGradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = barrelGradient;
    ctx.fillRect(size/3, -size/8, size*0.5, size/4);

    // Barrel outline
    ctx.strokeStyle = this.stats.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(size/3, -size/8, size*0.5, size/4);

    // Barrel tip energy glow
    ctx.shadowColor = this.stats.color;
    ctx.shadowBlur = 15;
    const tipGradient = ctx.createRadialGradient(size*0.85, 0, 0, size*0.85, 0, 6);
    tipGradient.addColorStop(0, '#ffffff');
    tipGradient.addColorStop(0.5, this.stats.color);
    tipGradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = tipGradient;
    ctx.beginPath();
    ctx.arc(size*0.85, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Draw level indicators with glow
    for (let i = 0; i < this.level + 1; i++) {
      const indicatorGradient = ctx.createRadialGradient(
        this.x - size/3 + i * 8,
        this.y + size/2 + 4,
        0,
        this.x - size/3 + i * 8,
        this.y + size/2 + 4,
        4
      );
      indicatorGradient.addColorStop(0, '#ffffff');
      indicatorGradient.addColorStop(0.5, this.stats.color);
      indicatorGradient.addColorStop(1, this.stats.color);

      ctx.fillStyle = indicatorGradient;
      ctx.shadowColor = this.stats.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(this.x - size/3 + i * 8, this.y + size/2 + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  drawAnnihilator(ctx, size, time) {
    // DOOM TOWER - THE ANNIHILATOR
    const pulse = Math.sin(time * 8) * 0.5 + 0.5;
    const fastPulse = Math.sin(time * 20) * 0.5 + 0.5;

    // Massive glowing base
    const baseGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 1.2);
    baseGradient.addColorStop(0, `rgba(255,100,0,${0.8 + pulse * 0.2})`);
    baseGradient.addColorStop(0.5, `rgba(255,0,0,${0.6 + pulse * 0.2})`);
    baseGradient.addColorStop(1, 'rgba(100,0,0,0.3)');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * 1.0, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing doom rings
    for (let i = 0; i < 3; i++) {
      const ringSize = size * (0.8 + i * 0.3) * (1 + pulse * 0.1);
      ctx.strokeStyle = `rgba(255,${50 + i * 50},0,${0.8 - i * 0.2})`;
      ctx.lineWidth = 3 - i;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(this.x, this.y, ringSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Rotating energy beams
    ctx.save();
    ctx.translate(this.x, this.y);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time * 3;
      ctx.rotate(Math.PI / 3);

      const beamGradient = ctx.createLinearGradient(0, 0, size * 1.5, 0);
      beamGradient.addColorStop(0, `rgba(255,255,0,${0.8 * fastPulse})`);
      beamGradient.addColorStop(0.5, `rgba(255,100,0,${0.5 * fastPulse})`);
      beamGradient.addColorStop(1, 'rgba(255,0,0,0)');

      ctx.fillStyle = beamGradient;
      ctx.fillRect(0, -2, size * 1.5, 4);
    }
    ctx.restore();

    // Central doom core
    const coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 0.5);
    coreGradient.addColorStop(0, '#ffffff');
    coreGradient.addColorStop(0.3, '#ffff00');
    coreGradient.addColorStop(0.6, '#ff6600');
    coreGradient.addColorStop(1, '#ff0000');
    ctx.fillStyle = coreGradient;
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 30 + pulse * 20;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Skull emblem
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☠', this.x, this.y);

    // Floating particles around tower
    for (let i = 0; i < 8; i++) {
      const particleAngle = (i / 8) * Math.PI * 2 + time * 2;
      const particleR = size * 0.9;
      const px = this.x + Math.cos(particleAngle) * particleR;
      const py = this.y + Math.sin(particleAngle) * particleR;

      ctx.fillStyle = `rgba(255,${Math.floor(Math.random() * 155 + 100)},0,${0.8})`;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, 3 + fastPulse * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Level indicators (flames)
    for (let i = 0; i <= this.level; i++) {
      const flameX = this.x - size * 0.5 + i * size * 0.5;
      const flameY = this.y + size * 0.8;
      const flameSize = 6 + Math.sin(time * 10 + i) * 2;

      const flameGradient = ctx.createRadialGradient(flameX, flameY, 0, flameX, flameY, flameSize);
      flameGradient.addColorStop(0, '#ffffff');
      flameGradient.addColorStop(0.3, '#ffff00');
      flameGradient.addColorStop(0.6, '#ff6600');
      flameGradient.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = flameGradient;
      ctx.beginPath();
      ctx.arc(flameX, flameY - flameSize * 0.5, flameSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  drawRange(ctx) {
    const stats = this.getStats();
    const time = performance.now() / 1000;

    // Dotted pulsing border
    const pulse = Math.sin(time * 3) * 0.3 + 0.7;
    ctx.setLineDash([8, 8]); // Dotted line pattern
    ctx.strokeStyle = this.stats.color.replace(')', `, ${pulse * 0.8})`).replace('rgb', 'rgba');
    ctx.lineWidth = 3;
    ctx.shadowColor = this.stats.color;
    ctx.shadowBlur = 12 * pulse;
    ctx.beginPath();
    ctx.arc(this.x, this.y, stats.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner dotted ring
    ctx.strokeStyle = this.stats.color.replace(')', ', 0.5)').replace('rgb', 'rgba');
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, stats.range * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Reset line dash
    ctx.setLineDash([]);
  }
}
