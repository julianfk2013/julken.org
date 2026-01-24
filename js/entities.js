class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = CONFIG.PLAYER_WIDTH;
    this.height = CONFIG.PLAYER_HEIGHT;
    this.speed = CONFIG.PLAYER_SPEED;
    this.vx = 0;
    this.vy = 0;
    this.hp = CONFIG.PLAYER_MAX_HP;
    this.maxHp = CONFIG.PLAYER_MAX_HP;
    this.shields = CONFIG.PLAYER_START_SHIELDS;
    this.lastShot = 0;
    this.fireRate = CONFIG.PLAYER_FIRE_RATE;
    this.glowIntensity = 0;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
  }

  update(dt, keys, mouseX, canvasWidth, canvasHeight) {
    this.vx = 0;
    this.vy = 0;

    if (keys['ArrowLeft'] || keys['KeyA']) this.vx = -this.speed;
    if (keys['ArrowRight'] || keys['KeyD']) this.vx = this.speed;
    if (keys['ArrowUp'] || keys['KeyW']) this.vy = -this.speed;
    if (keys['ArrowDown'] || keys['KeyS']) this.vy = this.speed;

    if (mouseX !== null && mouseX !== undefined) {
      const targetX = mouseX - this.width / 2;
      const dx = targetX - this.x;
      if (Math.abs(dx) > 5) {
        this.vx = dx * 8;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.x = Physics.clamp(this.x, 0, canvasWidth - this.width);
    this.y = Physics.clamp(this.y, 0, canvasHeight - this.height);

    this.lastShot += dt * 1000;

    if (this.glowIntensity > 0) {
      this.glowIntensity = Math.max(0, this.glowIntensity - dt * 2);
    }

    if (this.invulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
    }
  }

  shoot() {
    if (this.lastShot >= this.fireRate) {
      this.lastShot = 0;
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    if (this.invulnerable) return false;

    if (this.shields > 0) {
      this.shields -= amount;
      if (this.shields < 0) {
        this.hp += this.shields;
        this.shields = 0;
      }
    } else {
      this.hp -= amount;
    }

    this.glowIntensity = 1;
    this.invulnerable = true;
    this.invulnerableTimer = 1;

    return this.hp <= 0;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addShield(amount) {
    this.shields = Math.min(100, this.shields + amount);
  }

  draw(ctx) {
    if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    if (this.glowIntensity > 0) {
      ctx.shadowBlur = 20 * this.glowIntensity;
      ctx.shadowColor = '#ef4444';
    }

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f97316';
    ctx.fillRect(this.x + this.width / 2 - 3, this.y + this.height, 6, 8);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    if (this.shields > 0) {
      ctx.strokeStyle = `rgba(34, 197, 94, ${this.shields / 100})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }
}

class Bullet {
  constructor(x, y, type = 'normal') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = CONFIG.BULLET_WIDTH;
    this.height = CONFIG.BULLET_HEIGHT;
    this.damage = CONFIG.BULLET_DAMAGE;
    this.speed = CONFIG.BULLET_SPEED;
    this.vx = 0;
    this.vy = -this.speed;
    this.destroyed = false;
    this.trail = [];

    if (type === 'laser') {
      this.height = 30;
      this.damage = 5;
    } else if (type === 'homing') {
      this.damage = 15;
      this.turnSpeed = 3;
    } else if (type === 'torpedo') {
      this.width = 12;
      this.height = 25;
      this.damage = 25;
    }
  }

  update(dt, enemies = []) {
    if (this.type === 'homing' && enemies.length > 0) {
      const nearest = this.findNearestEnemy(enemies);
      if (nearest) {
        const dx = nearest.x - this.x;
        const dy = nearest.y - this.y;
        const angle = Math.atan2(dy, dx);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.trail.push({ x: this.x, y: this.y, life: 0.3 });
    if (this.trail.length > 5) {
      this.trail.shift();
    }
  }

  findNearestEnemy(enemies) {
    let nearest = null;
    let minDist = Infinity;

    enemies.forEach(enemy => {
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });

    return nearest;
  }

  draw(ctx) {
    this.trail.forEach((t, i) => {
      const alpha = (i / this.trail.length) * t.life;
      ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
      const size = this.width * 0.8 * (i / this.trail.length);
      ctx.fillRect(t.x - size / 2, t.y, size, this.height * 0.5);
    });

    if (this.type === 'laser') {
      ctx.fillStyle = '#22c55e';
    } else if (this.type === 'homing') {
      ctx.fillStyle = '#f97316';
    } else if (this.type === 'torpedo') {
      ctx.fillStyle = '#8b5cf6';
    } else {
      ctx.fillStyle = '#38bdf8';
    }

    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

    if (this.type !== 'normal') {
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
      ctx.shadowBlur = 0;
    }
  }

  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.props = ENEMY_PROPS[type];
    this.hp = this.props.hp;
    this.maxHp = this.props.hp;
    this.width = 40;
    this.height = 40;
    this.speed = this.props.speed;
    this.destroyed = false;
    this.shootTimer = 0;
    this.pattern = 'straight';
    this.moveTimer = 0;
    this.dodgeTimer = 0;
    this.teleportTimer = 0;
    this.spawnTimer = 0;
    this.vx = 0;
    this.vy = this.speed;

    if (type === ENEMY_TYPES.KAMIKAZE) {
      this.pattern = 'dive';
    } else if (type === ENEMY_TYPES.DODGER) {
      this.pattern = 'sine';
    }
  }

  update(dt, playerX, canvasWidth) {
    if (this.destroyed) return;

    this.moveTimer += dt;

    if (this.pattern === 'straight') {
      this.vy = this.speed;
      this.vx = 0;
    } else if (this.pattern === 'sine') {
      this.vy = this.speed * 0.7;
      this.vx = Math.sin(this.moveTimer * 3) * 100;
    } else if (this.pattern === 'zigzag') {
      this.vy = this.speed * 0.8;
      this.vx = Math.sign(Math.sin(this.moveTimer * 2)) * 80;
    } else if (this.pattern === 'dive' && playerX !== undefined) {
      const dx = playerX - this.x;
      const angle = Math.atan2(this.speed * 1.5, dx);
      this.vx = Math.cos(angle) * this.speed * 1.5;
      this.vy = this.speed * 1.5;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;

    this.shootTimer += dt;

    if (this.type === ENEMY_TYPES.DODGER) {
      this.dodgeTimer += dt;
    }

    if (this.type === ENEMY_TYPES.TELEPORTER) {
      this.teleportTimer += dt;
      if (this.teleportTimer >= 4) {
        this.x = Math.random() * (canvasWidth - this.width);
        this.teleportTimer = 0;
      }
    }

    if (this.type === ENEMY_TYPES.SPAWNER) {
      this.spawnTimer += dt;
    }
  }

  canShoot() {
    const interval = 1 / this.props.shootChance;
    if (this.shootTimer >= interval) {
      this.shootTimer = 0;
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroyed = true;
      return true;
    }
    return false;
  }

  draw(ctx) {
    if (this.destroyed) return;

    let color = this.props.color;
    if (this.hp < this.maxHp) {
      const ratio = this.hp / this.maxHp;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      color = `rgb(${Math.floor(r * ratio)}, ${Math.floor(g * ratio)}, ${Math.floor(b * ratio)})`;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y + this.height);
    ctx.lineTo(this.x, this.y);
    ctx.lineTo(this.x + this.width, this.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.type === ENEMY_TYPES.SHIELDED && this.hp > 1) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.type === ENEMY_TYPES.KAMIKAZE) {
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', this.x + this.width / 2, this.y + this.height / 2 + 7);
    }

    if (this.type === ENEMY_TYPES.BOMBER) {
      ctx.fillText('💣', this.x + this.width / 2, this.y + this.height / 2 + 7);
    }
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }
}

class EnemyBullet {
  constructor(x, y, vx = 0, vy = CONFIG.ENEMY_BULLET_SPEED) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 8;
    this.height = 15;
    this.damage = CONFIG.ENEMY_BULLET_DAMAGE;
    this.destroyed = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ef4444';
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }

  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.props = POWERUP_PROPS[type];
    this.width = 40;
    this.height = 40;
    this.vy = CONFIG.POWERUP_FALL_SPEED;
    this.rotation = 0;
    this.collected = false;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.rotation += dt * 2;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    const gradient = ctx.createLinearGradient(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2);
    gradient.addColorStop(0, this.props.color);
    gradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.props.icon, 0, 0);

    ctx.restore();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

class Boss {
  constructor(level, config) {
    this.level = level;
    this.config = config;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.x = CONFIG.WIDTH / 2 - config.width / 2;
    this.y = 100;
    this.width = config.width;
    this.height = config.height;
    this.vx = config.speed;
    this.phase = 1;
    this.attackTimer = 0;
    this.projectiles = [];
    this.defeated = false;
  }

  update(dt, canvasWidth, playerX) {
    this.x += this.vx * dt;
    if (this.x <= 0 || this.x + this.width >= canvasWidth) {
      this.vx = -this.vx;
    }

    this.attackTimer += dt * 1000;
    if (this.attackTimer >= this.config.attackInterval) {
      this.attack(playerX);
      this.attackTimer = 0;
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      if (proj.y > CONFIG.HEIGHT + 50 || proj.y < -50) {
        this.projectiles.splice(i, 1);
      }
    }

    const hpRatio = this.hp / this.maxHp;
    if (hpRatio <= 0.66 && this.phase === 1) this.phase = 2;
    if (hpRatio <= 0.33 && this.phase === 2) this.phase = 3;
  }

  attack(playerX) {
    const pattern = this.config.pattern;
    const speed = this.config.projectileSpeed;
    const centerX = this.x + this.width / 2;
    const bottomY = this.y + this.height;

    if (pattern === 'spread3') {
      const randomAngle = (Math.random() - 0.5) * 4;
      this.projectiles.push({
        x: centerX,
        y: bottomY,
        vx: randomAngle * (60 + Math.random() * 40),
        vy: speed,
        width: 12,
        height: 20,
      });
    } else if (pattern === 'rapidfire') {
      if (playerX !== undefined) {
        const inaccuracy = (Math.random() - 0.5) * 150;
        const dx = playerX + inaccuracy - centerX;
        const angle = Math.atan2(speed, dx);
        this.projectiles.push({
          x: centerX,
          y: bottomY,
          vx: Math.sin(angle) * speed,
          vy: speed,
          width: 10,
          height: 20,
        });
      }
    } else if (pattern === 'missiles') {
      const randomX = (Math.random() - 0.5) * 80;
      const randomVx = (Math.random() - 0.5) * 60;
      this.projectiles.push({
        x: centerX + randomX,
        y: bottomY,
        vx: randomVx,
        vy: speed * 0.8,
        width: 15,
        height: 25,
        homing: true,
      });
    } else if (pattern === 'drones') {
      const randomX = (Math.random() - 0.5) * 100;
      const randomVx = (Math.random() - 0.5) * 80;
      this.projectiles.push({
        x: centerX + randomX,
        y: bottomY,
        vx: randomVx,
        vy: speed * 0.5,
        width: 20,
        height: 20,
        isDrone: true,
      });
    } else if (pattern === 'all') {
      const patterns = ['spread3', 'rapidfire', 'missiles', 'drones'];
      const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
      this.config.pattern = randomPattern;
      this.attack(playerX);
      this.config.pattern = 'all';
    }
  }

  draw(ctx) {
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    gradient.addColorStop(0, this.config.color);
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x + 20, this.y + this.height - 10, 15, 10);
    ctx.fillRect(this.x + this.width - 35, this.y + this.height - 10, 15, 10);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.config.name, this.x + this.width / 2, this.y - 15);

    const barWidth = this.width;
    const barHeight = 8;
    const barX = this.x;
    const barY = this.y - 35;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpRatio = this.hp / this.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    this.projectiles.forEach(proj => {
      if (proj.isDrone) {
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(proj.x - proj.width / 2, proj.y, proj.width, proj.height);
      } else if (proj.homing) {
        ctx.fillStyle = '#f97316';
        ctx.fillRect(proj.x - proj.width / 2, proj.y, proj.width, proj.height);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(proj.x - proj.width / 2, proj.y, proj.width, proj.height);
      }
    });
  }

  hit(damage = 1) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.defeated = true;
      return true;
    }
    return false;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.vy = CONFIG.POWERUP_FALL_SPEED;
    this.rotation = 0;
    this.collected = false;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.rotation += dt * 4;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
