// Projectile system - all projectile types

class Projectile {
  constructor(x, y, target, damage) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.dead = false;
  }
}

class LaserProjectile extends Projectile {
  constructor(x, y, target, damage) {
    super(x, y, target, damage);
    this.duration = 0.1; // Visual duration
    this.damageApplied = false;
  }

  update(dt, enemies) {
    // Apply damage immediately on first update
    if (!this.damageApplied && !this.target.dead) {
      this.target.takeDamage(this.damage);
      this.damageApplied = true;
    }

    // Keep projectile alive for visual effect
    this.duration -= dt;
    if (this.duration <= 0 || this.target.dead) {
      this.dead = true;
    }
    return [];
  }

  draw(ctx) {
    if (this.target && !this.target.dead) {
      // Draw multiple beam layers for depth
      // Outer glow
      ctx.strokeStyle = 'rgba(0,255,255,0.2)';
      ctx.lineWidth = 8;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();

      // Middle beam
      ctx.strokeStyle = 'rgba(0,255,255,0.6)';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();

      // Core beam
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 5;

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Add impact flash at target
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(this.target.x, this.target.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

class RocketProjectile extends Projectile {
  constructor(x, y, target, damage, areaRadius) {
    super(x, y, target, damage);
    this.speed = 200;
    this.areaRadius = areaRadius;
    this.exploded = false;
  }

  update(dt, enemies) {
    if (this.target.dead || this.exploded) {
      this.dead = true;
      return [];
    }

    // Move toward target
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      // Hit target - explode
      this.exploded = true;
      this.dead = true;

      // Damage all enemies in area
      const particles = [];
      for (const enemy of enemies) {
        const edx = enemy.x - this.target.x;
        const edy = enemy.y - this.target.y;
        const edist = Math.sqrt(edx * edx + edy * edy);

        if (edist <= this.areaRadius) {
          enemy.takeDamage(this.damage);
        }
      }

      // Create explosion particles
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10;
        particles.push(new Particle(
          this.target.x,
          this.target.y,
          Math.cos(angle) * 100,
          Math.sin(angle) * 100,
          0.5,
          '#ff4444'
        ));
      }
      return particles;
    } else {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
    return [];
  }

  draw(ctx) {
    // Draw rocket with flame trail
    if (this.target && !this.target.dead) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const angle = Math.atan2(dy, dx);

      // Draw exhaust flame
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);

      const gradient = ctx.createLinearGradient(0, 0, -15, 0);
      gradient.addColorStop(0, 'rgba(255,200,0,0.8)');
      gradient.addColorStop(0.5, 'rgba(255,68,68,0.5)');
      gradient.addColorStop(1, 'rgba(255,68,68,0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(-15, -3, 15, 6);

      ctx.restore();
    }

    // Draw rocket body
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Add bright center
    ctx.fillStyle = '#ffaa44';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }
}

class PlasmaProjectile extends Projectile {
  constructor(x, y, target, damage, slowAmount) {
    super(x, y, target, damage);
    this.speed = 150;
    this.slowAmount = slowAmount;
    this.trail = [];
  }

  update(dt, enemies) {
    if (this.target.dead) {
      this.dead = true;
      return [];
    }

    // Move toward target
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Add trail
    this.trail.push({x: this.x, y: this.y, life: 0.3});
    this.trail = this.trail.filter(t => {
      t.life -= dt;
      return t.life > 0;
    });

    if (dist < 8) {
      // Hit target
      this.dead = true;
      this.target.takeDamage(this.damage);
      this.target.applySlow(this.slowAmount, 2.0);
    } else {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
    return [];
  }

  draw(ctx) {
    // Draw trail
    for (const t of this.trail) {
      const alpha = t.life / 0.3;
      ctx.fillStyle = `rgba(170,68,255,${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw projectile
    ctx.fillStyle = '#aa44ff';
    ctx.shadowColor = '#aa44ff';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }
}

class TeslaProjectile extends Projectile {
  constructor(x, y, target, damage, chainCount) {
    super(x, y, target, damage);
    this.chainCount = chainCount;
    this.duration = 0.2;
    this.hitEnemies = [target];
  }

  update(dt, enemies) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.dead = true;

      // Apply damage to all chained enemies
      for (const enemy of this.hitEnemies) {
        if (!enemy.dead) {
          enemy.takeDamage(this.damage);
        }
      }

      // Try to chain to nearby enemies
      while (this.hitEnemies.length < this.chainCount && this.hitEnemies.length < enemies.length) {
        const lastHit = this.hitEnemies[this.hitEnemies.length - 1];
        let closest = null;
        let closestDist = 100; // Max chain distance

        for (const enemy of enemies) {
          if (this.hitEnemies.includes(enemy) || enemy.dead) continue;

          const dx = enemy.x - lastHit.x;
          const dy = enemy.y - lastHit.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < closestDist) {
            closest = enemy;
            closestDist = dist;
          }
        }

        if (closest) {
          this.hitEnemies.push(closest);
        } else {
          break;
        }
      }
    }
    return [];
  }

  draw(ctx) {
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;

    // Draw lightning chain
    for (let i = 0; i < this.hitEnemies.length - 1; i++) {
      const from = this.hitEnemies[i];
      const to = this.hitEnemies[i + 1];

      if (from.dead || to.dead) continue;

      // Draw jagged lightning bolt
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);

      const segments = 3;
      for (let j = 1; j < segments; j++) {
        const t = j / segments;
        const x = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 10;
        const y = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 10;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    // Draw from tower to first target
    if (this.hitEnemies.length > 0 && !this.hitEnemies[0].dead) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.hitEnemies[0].x, this.hitEnemies[0].y);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }
}

class SniperProjectile extends Projectile {
  constructor(x, y, target, damage) {
    super(x, y, target, damage);
    this.speed = 600; // Very fast
  }

  update(dt, enemies) {
    if (this.target.dead) {
      this.dead = true;
      return [];
    }

    // Move toward target
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      // Hit target
      this.dead = true;
      this.target.takeDamage(this.damage);
    } else {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
    return [];
  }

  draw(ctx) {
    // Draw sniper bullet trail
    const dx = this.vx || 0;
    const dy = this.vy || 0;

    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(this.x - dx * 0.2, this.y - dy * 0.2);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    // Bullet
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }
}

class FlameProjectile extends Projectile {
  constructor(x, y, target, damage, dotDamage, dotDuration) {
    super(x, y, target, damage);
    this.speed = 120;
    this.dotDamage = dotDamage;
    this.dotDuration = dotDuration;
    this.particles = [];
  }

  update(dt, enemies) {
    if (this.target.dead) {
      this.dead = true;
      return [];
    }

    // Add flame particles
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: this.x + (Math.random() - 0.5) * 8,
        y: this.y + (Math.random() - 0.5) * 8,
        life: 0.3,
        maxLife: 0.3
      });
    }

    // Update particles
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      return p.life > 0;
    });

    // Move toward target
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      // Hit target - apply burn
      this.dead = true;
      this.target.takeDamage(this.damage);

      // Apply burn effect
      if (!this.target.burning) {
        this.target.burning = {
          damage: this.dotDamage,
          timer: this.dotDuration,
          tickRate: 0.5,
          tickTimer: 0
        };
      } else {
        // Refresh burn
        this.target.burning.timer = Math.max(this.target.burning.timer, this.dotDuration);
      }
    } else {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
    return [];
  }

  draw(ctx) {
    // Draw flame particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      const size = 4 * alpha;

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
      gradient.addColorStop(0, `rgba(255,255,100,${alpha})`);
      gradient.addColorStop(0.5, `rgba(255,100,0,${alpha * 0.7})`);
      gradient.addColorStop(1, `rgba(255,50,0,0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw flame core
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }
}

class RailgunProjectile extends Projectile {
  constructor(x, y, target, damage, pierceCount, range) {
    super(x, y, target, damage);
    this.pierceCount = pierceCount;
    this.range = range;
    this.duration = 0.15;
    this.hitEnemies = [];

    // Calculate beam direction
    const dx = target.x - x;
    const dy = target.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.dirX = dx / dist;
    this.dirY = dy / dist;
    this.endX = x + this.dirX * range;
    this.endY = y + this.dirY * range;
  }

  update(dt, enemies) {
    this.duration -= dt;

    if (this.duration <= 0) {
      this.dead = true;

      // Find all enemies along the beam line and damage them
      let hitCount = 0;
      for (const enemy of enemies) {
        if (hitCount >= this.pierceCount) break;
        if (this.hitEnemies.includes(enemy)) continue;

        // Check if enemy is close to beam line
        const dist = this.pointToLineDistance(enemy.x, enemy.y, this.x, this.y, this.endX, this.endY);
        if (dist < 15) {
          enemy.takeDamage(this.damage);
          this.hitEnemies.push(enemy);
          hitCount++;
        }
      }
    }
    return [];
  }

  pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  draw(ctx) {
    // Draw powerful beam
    ctx.save();

    // Outer glow
    ctx.strokeStyle = 'rgba(0,170,255,0.3)';
    ctx.lineWidth = 16;
    ctx.shadowColor = '#00aaff';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.endX, this.endY);
    ctx.stroke();

    // Middle beam
    ctx.strokeStyle = 'rgba(100,200,255,0.6)';
    ctx.lineWidth = 8;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.endX, this.endY);
    ctx.stroke();

    // Core beam
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.endX, this.endY);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

class FreezeProjectile extends Projectile {
  constructor(x, y, target, damage, slowAmount, slowDuration) {
    super(x, y, target, damage);
    this.speed = 180;
    this.slowAmount = slowAmount;
    this.slowDuration = slowDuration;
    this.crystals = [];
  }

  update(dt, enemies) {
    if (this.target.dead) {
      this.dead = true;
      return [];
    }

    // Add ice crystal particles
    if (Math.random() < 0.5) {
      this.crystals.push({
        x: this.x + (Math.random() - 0.5) * 10,
        y: this.y + (Math.random() - 0.5) * 10,
        life: 0.4,
        size: Math.random() * 4 + 2
      });
    }

    // Update crystals
    this.crystals = this.crystals.filter(c => {
      c.life -= dt;
      c.y -= 15 * dt;
      return c.life > 0;
    });

    // Move toward target
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      // Hit target - apply freeze
      this.dead = true;
      this.target.takeDamage(this.damage);
      this.target.applySlow(this.slowAmount, this.slowDuration);

      // Create freeze burst particles
      const particles = [];
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        particles.push(new Particle(
          this.target.x,
          this.target.y,
          Math.cos(angle) * 60,
          Math.sin(angle) * 60,
          0.4,
          '#88ddff'
        ));
      }
      return particles;
    } else {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
    return [];
  }

  draw(ctx) {
    // Draw ice crystals trail
    for (const c of this.crystals) {
      const alpha = c.life / 0.4;
      ctx.fillStyle = `rgba(200,240,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ice core
    ctx.fillStyle = '#88ddff';
    ctx.shadowColor = '#88ddff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // White center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }
}

class MortarProjectile extends Projectile {
  constructor(x, y, target, damage, areaRadius) {
    super(x, y, target, damage);
    this.areaRadius = areaRadius;
    this.exploded = false;

    // Mortar follows arc trajectory
    this.targetX = target.x;
    this.targetY = target.y;
    this.startX = x;
    this.startY = y;
    this.flightTime = 0;
    this.totalFlightTime = 1.2; // Slow arc
    this.arcHeight = 80;
  }

  update(dt, enemies) {
    if (this.exploded) {
      this.dead = true;
      return [];
    }

    this.flightTime += dt;
    const t = Math.min(this.flightTime / this.totalFlightTime, 1);

    // Parabolic arc
    this.x = this.startX + (this.targetX - this.startX) * t;
    this.y = this.startY + (this.targetY - this.startY) * t - Math.sin(t * Math.PI) * this.arcHeight;

    if (t >= 1) {
      // Explode at target location
      this.exploded = true;
      this.dead = true;

      // Damage all enemies in area
      const particles = [];
      for (const enemy of enemies) {
        const dx = enemy.x - this.targetX;
        const dy = enemy.y - this.targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.areaRadius) {
          // Damage falls off with distance
          const falloff = 1 - (dist / this.areaRadius) * 0.5;
          enemy.takeDamage(this.damage * falloff);
        }
      }

      // Create big explosion particles
      for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 * i) / 16;
        const speed = 80 + Math.random() * 40;
        particles.push(new Particle(
          this.targetX,
          this.targetY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.6,
          '#ffaa44'
        ));
      }
      // Inner explosion
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        particles.push(new Particle(
          this.targetX,
          this.targetY,
          Math.cos(angle) * 40,
          Math.sin(angle) * 40,
          0.4,
          '#ffffff'
        ));
      }
      return particles;
    }
    return [];
  }

  draw(ctx) {
    // Draw shadow on ground
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    const shadowX = this.startX + (this.targetX - this.startX) * (this.flightTime / this.totalFlightTime);
    const shadowY = this.startY + (this.targetY - this.startY) * (this.flightTime / this.totalFlightTime);
    ctx.ellipse(shadowX, shadowY + 5, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw mortar shell
    ctx.fillStyle = '#aa6633';
    ctx.shadowColor = '#ffaa44';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
    ctx.fill();

    // Shell highlight
    ctx.fillStyle = '#cc8844';
    ctx.beginPath();
    ctx.arc(this.x - 2, this.y - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Draw target indicator
    ctx.strokeStyle = 'rgba(255,100,50,0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(this.targetX, this.targetY, this.areaRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ANNIHILATOR - THE ULTIMATE WEAPON OF DESTRUCTION
class AnnihilatorProjectile extends Projectile {
  constructor(x, y, target, damage, areaRadius, chainCount, slowAmount, slowDuration, range) {
    super(x, y, target, damage);
    this.areaRadius = areaRadius;
    this.chainCount = chainCount;
    this.slowAmount = slowAmount;
    this.slowDuration = slowDuration;
    this.range = range;
    this.speed = 800; // FAST
    this.exploded = false;
    this.targetX = target.x;
    this.targetY = target.y;
    this.hitEnemies = new Set();
    this.chainTargets = [];
    this.chainTimer = 0;
    this.chainIndex = 0;
    this.beamDuration = 0.3;
  }

  update(dt, enemies) {
    const particles = [];

    if (!this.exploded) {
      // Move toward target
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.speed * dt) {
        // MASSIVE EXPLOSION
        this.exploded = true;
        this.x = this.targetX;
        this.y = this.targetY;

        // OBLITERATE everything in area
        for (const enemy of enemies) {
          const eDist = Math.sqrt(
            Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2)
          );
          if (eDist <= this.areaRadius && !this.hitEnemies.has(enemy)) {
            // Apply MASSIVE damage
            enemy.takeDamage(this.damage);
            // Apply slow
            enemy.applySlow(this.slowAmount, this.slowDuration);
            this.hitEnemies.add(enemy);

            // Add to chain targets
            if (this.chainTargets.length < this.chainCount) {
              this.chainTargets.push(enemy);
            }
          }
        }

        // Create MASSIVE explosion particles
        for (let i = 0; i < 100; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 400 + 100;
          particles.push(new Particle(
            this.x, this.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            1.0,
            ['#ff0000', '#ff6600', '#ffff00', '#ffffff'][Math.floor(Math.random() * 4)]
          ));
        }

        // Find MORE targets to chain to
        for (const enemy of enemies) {
          if (!this.hitEnemies.has(enemy) && this.chainTargets.length < this.chainCount) {
            this.chainTargets.push(enemy);
          }
        }
      } else {
        // Move toward target
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;

        // Trail particles
        for (let i = 0; i < 5; i++) {
          particles.push(new Particle(
            this.x + (Math.random() - 0.5) * 20,
            this.y + (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            0.3,
            ['#ff0000', '#ffff00'][Math.floor(Math.random() * 2)]
          ));
        }
      }
    } else {
      // Chain lightning phase
      this.chainTimer += dt;

      if (this.chainTimer > 0.05 && this.chainIndex < this.chainTargets.length) {
        const chainTarget = this.chainTargets[this.chainIndex];
        if (chainTarget && !chainTarget.dead) {
          // ANNIHILATE chained enemy
          chainTarget.takeDamage(this.damage);
          chainTarget.applySlow(this.slowAmount, this.slowDuration);

          // Chain particles
          for (let i = 0; i < 20; i++) {
            particles.push(new Particle(
              chainTarget.x + (Math.random() - 0.5) * 30,
              chainTarget.y + (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 200,
              (Math.random() - 0.5) * 200,
              0.4,
              '#ffff00'
            ));
          }
        }
        this.chainIndex++;
        this.chainTimer = 0;
      }

      this.beamDuration -= dt;
      if (this.beamDuration <= 0 && this.chainIndex >= this.chainTargets.length) {
        this.dead = true;
      }
    }

    return particles;
  }

  draw(ctx) {
    if (!this.exploded) {
      // Draw DOOM projectile
      const time = performance.now() / 1000;

      // Outer doom glow
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 30);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.2, '#ffff00');
      gradient.addColorStop(0.5, '#ff6600');
      gradient.addColorStop(0.8, '#ff0000');
      gradient.addColorStop(1, 'rgba(255,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
      ctx.fill();

      // Inner core
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
      ctx.fill();

      // Skull symbol
      ctx.fillStyle = '#000000';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠', this.x, this.y);

      ctx.shadowBlur = 0;
    } else {
      // Draw explosion and chain beams
      const alpha = this.beamDuration / 0.3;

      // Massive explosion ring
      ctx.strokeStyle = `rgba(255,0,0,${alpha})`;
      ctx.lineWidth = 8;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.areaRadius * (1 - alpha * 0.5), 0, Math.PI * 2);
      ctx.stroke();

      // Inner ring
      ctx.strokeStyle = `rgba(255,255,0,${alpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.areaRadius * 0.5 * (1 - alpha * 0.5), 0, Math.PI * 2);
      ctx.stroke();

      // Draw chain lightning to targets
      for (let i = 0; i <= this.chainIndex && i < this.chainTargets.length; i++) {
        const target = this.chainTargets[i];
        if (target && !target.dead) {
          // Lightning beam
          ctx.strokeStyle = `rgba(255,255,0,${alpha})`;
          ctx.lineWidth = 4;
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);

          // Jagged lightning
          const dx = target.x - this.x;
          const dy = target.y - this.y;
          const segments = 8;
          for (let j = 1; j <= segments; j++) {
            const t = j / segments;
            const px = this.x + dx * t + (Math.random() - 0.5) * 30 * (1 - t);
            const py = this.y + dy * t + (Math.random() - 0.5) * 30 * (1 - t);
            ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;
    }
  }
}

// Particle system for explosions
class Particle {
  constructor(x, y, vx, vy, life, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life <= 0;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    const size = 3 * (this.life / this.maxLife);

    // Outer glow
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 2);
    gradient.addColorStop(0, this.color.replace(')', `,${alpha})`).replace('rgb', 'rgba'));
    gradient.addColorStop(0.5, this.color.replace(')', `,${alpha * 0.5})`).replace('rgb', 'rgba'));
    gradient.addColorStop(1, this.color.replace(')', ',0)').replace('rgb', 'rgba'));

    ctx.fillStyle = gradient;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8 * alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Bright core
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }
}
