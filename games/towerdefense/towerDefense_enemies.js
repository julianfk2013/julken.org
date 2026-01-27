// Enemy system - movement, health, types

class Enemy {
  constructor(type, path, startIndex = 0) {
    this.type = type;
    this.stats = ENEMY_STATS[type];
    this.health = this.stats.health;
    this.maxHealth = this.stats.health;
    this.speed = this.stats.speed;
    this.value = this.stats.value;
    this.flying = this.stats.flying || false;

    this.path = path;
    this.pathIndex = startIndex;
    this.x = path[this.pathIndex].x;
    this.y = path[this.pathIndex].y;

    this.slowAmount = 0;
    this.slowTimer = 0;
    this.dead = false;
    this.reachedEnd = false;

    // Special abilities
    this.shield = this.stats.shield || 0;
    this.maxShield = this.shield;
    this.armor = this.stats.armor || 0;
    this.regen = this.stats.regen || 0;
    this.splits = this.stats.splits || false;
    this.hasSplit = false;
  }

  getCurrentSpeed() {
    return this.speed * (1 - this.slowAmount);
  }

  takeDamage(amount) {
    // Apply armor reduction
    if (this.armor > 0) {
      amount *= (1 - this.armor);
    }

    // Shield absorbs damage first
    if (this.shield > 0) {
      const shieldDamage = Math.min(this.shield, amount);
      this.shield -= shieldDamage;
      amount -= shieldDamage;

      if (amount <= 0) {
        return false; // Shield absorbed all damage
      }
    }

    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  applySlow(amount, duration) {
    this.slowAmount = Math.max(this.slowAmount, amount);
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  update(dt) {
    // Update slow effect
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowAmount = 0;
      }
    }

    // Update burning effect
    if (this.burning) {
      this.burning.timer -= dt;
      this.burning.tickTimer -= dt;

      if (this.burning.tickTimer <= 0) {
        this.health -= this.burning.damage;
        this.burning.tickTimer = this.burning.tickRate;

        if (this.health <= 0) {
          this.dead = true;
        }
      }

      if (this.burning.timer <= 0) {
        this.burning = null;
      }
    }

    // Regeneration
    if (this.regen > 0 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.regen * dt);
    }

    // Move along path
    if (this.pathIndex >= this.path.length - 1) {
      this.reachedEnd = true;
      return;
    }

    const target = this.path[this.pathIndex + 1];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const moveSpeed = this.getCurrentSpeed() * dt;

    if (dist <= moveSpeed) {
      // Reached next waypoint
      this.pathIndex++;
      if (this.pathIndex >= this.path.length - 1) {
        this.reachedEnd = true;
      } else {
        this.x = this.path[this.pathIndex].x;
        this.y = this.path[this.pathIndex].y;
      }
    } else {
      // Move toward next waypoint
      this.x += (dx / dist) * moveSpeed;
      this.y += (dy / dist) * moveSpeed;
    }
  }

  draw(ctx) {
    const size = this.stats.size;
    const time = performance.now() / 1000;

    // Draw shadow
    if (!this.flying) {
      const shadowGradient = ctx.createRadialGradient(this.x, this.y + size/2 + 3, 0, this.x, this.y + size/2 + 3, size);
      shadowGradient.addColorStop(0, 'rgba(0,0,0,0.4)');
      shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGradient;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + size/2 + 3, size*0.8, size*0.25, 0, 0, Math.PI*2);
      ctx.fill();
    }

    // Try to draw sprite first
    const spriteDrawn = assetLoader.loaded && assetLoader.drawEnemySprite(
      ctx, this.stats, this.x, this.y, size,
      { glow: true, tint: this.slowAmount > 0 || this.burning }
    );

    // If sprite couldn't be drawn, fall back to geometric shapes
    if (!spriteDrawn) {
      this.drawFallbackShape(ctx, size, time);
    }

    // Draw shield
    if (this.shield > 0) {
      const shieldPercent = this.shield / this.maxShield;
      ctx.strokeStyle = `rgba(68,136,255,${shieldPercent * 0.6})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Shield glow
      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw slow effect
    if (this.slowAmount > 0) {
      ctx.fillStyle = 'rgba(170,68,255,0.3)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, size + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw armor indicator
    if (this.armor > 0) {
      ctx.fillStyle = 'rgba(136,68,255,0.4)';
      ctx.fillRect(this.x - size/2, this.y - size/2, size, size/4);
    }

    // Draw regeneration indicator
    if (this.regen > 0) {
      const time = Date.now() * 0.003;
      const pulse = Math.sin(time) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(136,255,68,${pulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y - size - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw burning effect
    if (this.burning) {
      const time = Date.now() * 0.01;
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + time;
        const radius = size + 3;
        const px = this.x + Math.cos(angle) * radius;
        const py = this.y + Math.sin(angle) * radius - 5;

        const flameGradient = ctx.createRadialGradient(px, py, 0, px, py, 4);
        flameGradient.addColorStop(0, 'rgba(255,200,0,0.8)');
        flameGradient.addColorStop(0.5, 'rgba(255,100,0,0.5)');
        flameGradient.addColorStop(1, 'rgba(255,50,0,0)');

        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw health bar
    const barWidth = size * 2;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;

    let barY = this.y - size - 8;

    // Shield bar (if present)
    if (this.maxShield > 0) {
      const shieldPercent = this.shield / this.maxShield;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(this.x - barWidth/2, barY, barWidth * shieldPercent, barHeight);
      barY -= 6;
    }

    // Health bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);

    ctx.fillStyle = healthPercent > 0.5 ? '#44ff44' : (healthPercent > 0.25 ? '#ffdd44' : '#ff4444');
    ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);

    // Draw glow
    ctx.shadowColor = this.stats.color;
    ctx.shadowBlur = 6;
    ctx.strokeStyle = this.stats.color;
    ctx.lineWidth = 2;
    if (this.flying) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - size);
      ctx.lineTo(this.x - size, this.y + size/2);
      ctx.lineTo(this.x + size, this.y + size/2);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // Fallback geometric shape drawing when sprites aren't available
  drawFallbackShape(ctx, size, time) {
    if (this.flying) {
      // Flying enemies - sleek triangular ships
      const shipGradient = ctx.createLinearGradient(this.x, this.y - size, this.x, this.y + size);
      shipGradient.addColorStop(0, '#ffffff');
      shipGradient.addColorStop(0.3, this.stats.color);
      shipGradient.addColorStop(1, this.stats.color.replace(')', ', 0.7)').replace('rgb', 'rgba'));

      ctx.save();
      ctx.shadowColor = this.stats.color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = shipGradient;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - size * 1.2);
      ctx.lineTo(this.x - size * 0.8, this.y + size/2);
      ctx.lineTo(this.x, this.y + size * 0.3);
      ctx.lineTo(this.x + size * 0.8, this.y + size/2);
      ctx.closePath();
      ctx.fill();

      // Outline
      ctx.strokeStyle = this.stats.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Engine glow
      const engineGlow = Math.sin(time * 15) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(100, 200, 255, ${engineGlow})`;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y + size * 0.4, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Ground enemies - spherical with depth
      const bodyGradient = ctx.createRadialGradient(
        this.x - size/3, this.y - size/3, 0,
        this.x, this.y, size * 1.2
      );
      bodyGradient.addColorStop(0, '#ffffff');
      bodyGradient.addColorStop(0.2, this.stats.color);
      bodyGradient.addColorStop(0.8, this.stats.color);
      bodyGradient.addColorStop(1, this.stats.color.replace(')', ', 0.6)').replace('rgb', 'rgba'));

      ctx.save();
      ctx.fillStyle = bodyGradient;
      ctx.shadowColor = this.stats.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fill();

      // Bright outline
      ctx.strokeStyle = this.stats.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Core glow
      const coreGradient = ctx.createRadialGradient(this.x - size/4, this.y - size/4, 0, this.x, this.y, size/2);
      coreGradient.addColorStop(0, 'rgba(255,255,255,0.8)');
      coreGradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Enemy spawner - generates enemies lazily to save memory
class EnemySpawner {
  constructor(waveConfig, path, startPositions) {
    this.waveConfig = waveConfig;
    this.path = path;
    this.startPositions = startPositions;

    this.spawnTimer = 0;
    this.currentGroupIndex = 0;
    this.currentGroupSpawned = 0;
    this.completed = false;
  }

  getNextEnemy() {
    // Return next enemy type and delay, or null if wave is complete
    const groups = this.waveConfig.enemies;

    while (this.currentGroupIndex < groups.length) {
      const group = groups[this.currentGroupIndex];

      if (this.currentGroupSpawned < group.count) {
        this.currentGroupSpawned++;
        return {
          type: group.type,
          delay: group.interval
        };
      }

      // Move to next group
      this.currentGroupIndex++;
      this.currentGroupSpawned = 0;
    }

    return null; // Wave complete
  }

  update(dt) {
    if (this.completed) {
      return [];
    }

    this.spawnTimer -= dt;
    const spawned = [];

    while (this.spawnTimer <= 0) {
      const next = this.getNextEnemy();

      if (!next) {
        this.completed = true;
        break;
      }

      // Spawn enemy at random start position
      const startPos = this.startPositions[Math.floor(Math.random() * this.startPositions.length)];
      const startIndex = this.path.findIndex(p => p.x === startPos.x && p.y === startPos.y);

      spawned.push(new Enemy(next.type, this.path, startIndex));
      this.spawnTimer += next.delay;
    }

    return spawned;
  }
}
