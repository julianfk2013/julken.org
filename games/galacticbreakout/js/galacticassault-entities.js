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
    this.maxShields = 100;

    this.lastShot = 0;
    this.fireRate = CONFIG.PLAYER_FIRE_RATE;
    this.isShooting = false;

    this.glowIntensity = 0;
    this.engineGlow = 0;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.flashTimer = 0;

    this.trail = [];
    this.maxTrailLength = 10;

    this.rotation = 0;

    this.acceleration = 800;
    this.deceleration = 1200;
    this.targetVx = 0;
    this.currentVx = 0;
    this.maxSpeed = this.speed;

    this.targetRotation = 0;
    this.rotationSpeed = 8;

    this.directionChangeEffect = 0;
  }

  update(dt, keys, mouseX, canvasWidth, canvasHeight) {
    this.targetVx = 0;
    if (keys['ArrowLeft'] || keys['a']) this.targetVx = -this.maxSpeed;
    if (keys['ArrowRight'] || keys['d']) this.targetVx = this.maxSpeed;

    const isMoving = this.targetVx !== 0;

    if (this.currentVx !== this.targetVx) {
      const accel = isMoving ? this.acceleration : this.deceleration;
      const delta = this.targetVx - this.currentVx;
      const change = Math.sign(delta) * Math.min(Math.abs(delta), accel * dt);
      this.currentVx += change;
    }

    this.vx = this.currentVx;
    this.vy = 0;

    this.targetRotation = (this.vx / this.maxSpeed) * 0.35;
    const rotDelta = this.targetRotation - this.rotation;
    this.rotation += rotDelta * this.rotationSpeed * dt;

    if (isMoving) {
      const thrustSound = AudioManager.sounds.thrust;
      if (thrustSound && typeof thrustSound.paused !== 'undefined' && thrustSound.paused) {
        thrustSound.loop = true;
        thrustSound.play().catch(() => {});
      }
    } else {
      const thrustSound = AudioManager.sounds.thrust;
      if (thrustSound && typeof thrustSound.paused !== 'undefined' && !thrustSound.paused) {
        thrustSound.pause();
        thrustSound.currentTime = 0;
      }
    }

    this.x += this.vx * dt;

    this.x = Physics.clamp(this.x, 0, canvasWidth - this.width);
    this.y = canvasHeight - this.height - 20;

    if (Math.abs(this.vx) > 50 || Math.abs(this.vy) > 50) {
      this.trail.push({
        x: this.x + this.width / 2,
        y: this.y + this.height,
        alpha: 1,
        time: 0
      });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }

    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].time += dt;
      this.trail[i].alpha = Math.max(0, 1 - this.trail[i].time / 0.3);
      if (this.trail[i].alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }

    if (Math.sign(this.vx) !== Math.sign(this.targetVx) && Math.abs(this.vx) > 100) {
      this.directionChangeEffect = 0.5;
    }

    if (this.directionChangeEffect > 0) {
      this.directionChangeEffect -= dt * 2;
    }

    this.lastShot += dt * 1000;
    this.engineGlow = 0.5 + Math.sin(performance.now() / 100) * 0.5;

    if (this.glowIntensity > 0) {
      this.glowIntensity = Math.max(0, this.glowIntensity - dt * 3);
    }

    if (this.invulnerable) {
      this.invulnerableTimer -= dt;
      this.flashTimer += dt;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
    }

    if (this.shieldRegen && this.shields < this.maxShields) {
      const currentTime = Date.now() / 1000;
      const timeSinceLastDamage = currentTime - (this.lastDamageTime || 0);

      if (timeSinceLastDamage >= this.shieldRegenDelay) {
        this.shields = Math.min(this.maxShields, this.shields + this.shieldRegenRate * dt);
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

  resetMovement() {
    this.vx = 0;
    this.vy = 0;
    this.currentVx = 0;
    this.targetVx = 0;
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

    this.glowIntensity = 1.5;
    this.invulnerable = true;
    this.invulnerableTimer = 0.5;
    this.lastDamageTime = Date.now() / 1000;

    return this.hp <= 0;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addShield(amount) {
    this.shields = Math.min(this.maxShields, this.shields + amount);
  }

  draw(ctx) {
    this.trail.forEach((t, i) => {
      const size = 4 * (i / this.trail.length);
      ctx.fillStyle = `rgba(56, 189, 248, ${t.alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    if (this.invulnerable && Math.floor(this.flashTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    if (this.glowIntensity > 0) {
      ctx.shadowBlur = 25 * this.glowIntensity;
      ctx.shadowColor = '#ef4444';
    }

    const shipImg = AssetLoader.getPlayerShip('ship1', 'blue');

    if (shipImg) {
      ctx.save();
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(this.rotation);
      ctx.drawImage(
        shipImg,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
      ctx.restore();
    } else {
      const gradient = ctx.createLinearGradient(
        this.x, this.y,
        this.x, this.y + this.height
      );
      gradient.addColorStop(0, '#60a5fa');
      gradient.addColorStop(0.5, '#3b82f6');
      gradient.addColorStop(1, '#1e40af');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 3,
        this.width / 5,
        0, Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(this.x + 5, this.y + this.height - 20, 15, 8);
      ctx.fillRect(this.x + this.width - 20, this.y + this.height - 20, 15, 8);
    }

    const engineY = this.y + this.height;
    const engineGradient = ctx.createRadialGradient(
      this.x + this.width / 2, engineY,
      0,
      this.x + this.width / 2, engineY,
      15
    );
    engineGradient.addColorStop(0, `rgba(251, 146, 60, ${this.engineGlow})`);
    engineGradient.addColorStop(0.5, `rgba(249, 115, 22, ${this.engineGlow * 0.6})`);
    engineGradient.addColorStop(1, 'rgba(249, 115, 22, 0)');

    ctx.fillStyle = engineGradient;
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, engineY, 15, 0, Math.PI * 2);
    ctx.fill();

    if (this.directionChangeEffect > 0) {
      ctx.save();
      ctx.globalAlpha = this.directionChangeEffect;
      const burstGradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height,
        0,
        this.x + this.width / 2,
        this.y + this.height,
        30
      );
      burstGradient.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
      burstGradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = burstGradient;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    if (this.shields > 0) {
      ctx.save();

      const hexRadius = this.width * 0.8;
      const hexCount = 12;
      for (let i = 0; i < hexCount; i++) {
        const angle = (i / hexCount) * Math.PI * 2;
        const hx = this.x + this.width / 2 + Math.cos(angle) * hexRadius * 0.5;
        const hy = this.y + this.height / 2 + Math.sin(angle) * hexRadius * 0.5;

        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const a = (j / 6) * Math.PI * 2 + angle;
          const px = hx + Math.cos(a) * 8;
          const py = hy + Math.sin(a) * 8;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        const shimmer = Math.sin(Date.now() / 150 + i) * 0.3 + 0.5;
        ctx.strokeStyle = `rgba(34, 197, 94, ${(this.shields / 100) * shimmer})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.strokeStyle = `rgba(34, 197, 94, ${this.shields / 100 * 0.6})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#22c55e';
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, hexRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
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
  constructor(x, y, type = 'normal', angle = 0) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.angle = angle;
    this.width = CONFIG.BULLET_WIDTH;
    this.height = CONFIG.BULLET_HEIGHT;
    this.damage = CONFIG.BULLET_DAMAGE;
    this.speed = CONFIG.BULLET_SPEED;
    this.vx = Math.sin(angle) * this.speed;
    this.vy = -Math.cos(angle) * this.speed;
    this.destroyed = false;
    this.trail = [];
    this.piercing = false;
    this.waveTime = 0;
    this.waveAmplitude = 0;

    if (type === 'laser') {
      this.height = CONFIG.LASER_HEIGHT;
      this.damage = CONFIG.LASER_DAMAGE;
      this.width = CONFIG.LASER_WIDTH;
    } else if (type === 'homing') {
      this.width = CONFIG.MISSILE_WIDTH;
      this.height = CONFIG.MISSILE_HEIGHT;
      this.damage = CONFIG.MISSILE_DAMAGE;
      this.speed = CONFIG.MISSILE_SPEED;
      this.vy = -this.speed;
      this.turnSpeed = CONFIG.MISSILE_TURN_SPEED;
    } else if (type === 'wave') {
      this.waveAmplitude = 80;
      this.baseX = x;
    }
  }

  update(dt, enemies = []) {
    if (this.type === 'homing' && enemies.length > 0) {
      const nearest = this.findNearestEnemy(enemies);
      if (nearest) {
        const dx = nearest.getCenterX() - this.x;
        const dy = nearest.getCenterY() - this.y;
        const targetAngle = Math.atan2(dy, dx);
        const currentAngle = Math.atan2(this.vy, this.vx);

        let angleDiff = targetAngle - currentAngle;
        if (!isFinite(angleDiff)) angleDiff = 0;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const turn = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.turnSpeed * dt);
        const newAngle = currentAngle + turn;

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.vx = Math.cos(newAngle) * speed;
        this.vy = Math.sin(newAngle) * speed;
      }
    }

    if (this.type === 'wave') {
      this.waveTime += dt * 8;
      this.x = this.baseX + Math.sin(this.waveTime) * this.waveAmplitude;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.trail.push({ x: this.x, y: this.y, life: 0.2 });
    if (this.trail.length > 8) {
      this.trail.shift();
    }

    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].life -= dt;
    }
  }

  findNearestEnemy(enemies) {
    let nearest = null;
    let minDist = Infinity;

    enemies.forEach(enemy => {
      if (enemy.destroyed) return;
      const dist = Math.hypot(
        enemy.getCenterX() - this.x,
        enemy.getCenterY() - this.y
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });

    return nearest;
  }

  draw(ctx) {
    this.trail.forEach((t, i) => {
      if (t.life <= 0) return;
      const alpha = (i / this.trail.length) * Math.min(t.life / 0.2, 1);
      const size = this.width * 0.7 * (i / this.trail.length);

      let color = '56, 189, 248';
      if (this.type === 'laser') color = '34, 197, 94';
      else if (this.type === 'homing') color = '249, 115, 22';
      else if (this.type === 'wave') color = '139, 92, 246';

      ctx.fillStyle = `rgba(${color}, ${alpha * 0.6})`;
      ctx.fillRect(t.x - size / 2, t.y, size, this.height * 0.5);
    });

    const bulletImg = AssetLoader.getBullet(this.type, false);

    if (bulletImg) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.drawImage(
        bulletImg,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
      ctx.restore();
    } else {
      let color = '#38bdf8';
      if (this.type === 'laser') color = '#22c55e';
      else if (this.type === 'homing') color = '#f97316';
      else if (this.type === 'wave') color = '#8b5cf6';

      ctx.fillStyle = color;

      if (this.type === 'homing') {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);

        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      } else {
        ctx.fillRect(
          this.x - this.width / 2,
          this.y,
          this.width,
          this.height
        );
      }
    }

    if (this.type !== 'normal') {
      ctx.save();
      try {
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;
        ctx.fillRect(
          this.x - this.width / 2,
          this.y,
          this.width,
          this.height
        );
      } finally {
        ctx.restore();
      }
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
    this.type = type;
    this.props = ENEMY_PROPS[type];
    this.hp = this.props.hp;
    this.maxHp = this.props.hp;
    this.width = this.props.width;
    this.height = this.props.height;
    this.speed = this.props.speed;
    this.destroyed = false;

    this.hoverY = y;
    this.y = -this.height - 50;
    this.entering = true;
    this.vx = 0;
    this.vy = this.speed;
    this.movePattern = this.props.movePattern;
    this.moveTimer = 0;
    this.baseX = x;
    this.circleAngle = Math.random() * Math.PI * 2;
    this.circleRadius = 80;
    this.dodgeTimer = 0;

    this.shootTimer = Math.random() * 5;
    this.shootPattern = this.props.shootPattern;

    this.shield = this.props.shield || 0;
    this.maxShield = this.shield;
    this.armor = this.props.armor || 0;
    this.teleportTimer = 0;
    this.spawnTimer = 0;

    this.flashIntensity = 0;
    this.enginePulse = 0;

    this.rotation = 0;

    this.speedMultiplier = 1;
  }

  update(dt, playerX, playerY, canvasWidth, bullets = []) {
    if (this.destroyed) return;

    const effectiveDt = dt * this.speedMultiplier;

    this.moveTimer += effectiveDt;
    this.shootTimer += effectiveDt;
    this.enginePulse += effectiveDt * 10;

    if (this.entering) {
      this.y += 200 * dt;
      if (this.y >= this.hoverY) {
        this.y = this.hoverY;
        this.entering = false;
      }
      return;
    }

    switch (this.movePattern) {
      case 'straight':
        this.vx = Math.sin(this.moveTimer * 1.5) * 80;
        this.vy = 0;
        break;

      case 'sine':
        this.vx = Math.sin(this.moveTimer * 2) * 120;
        this.vy = 0;
        break;

      case 'zigzag':
        this.vx = Math.sign(Math.sin(this.moveTimer * 2)) * 100;
        this.vy = 0;
        break;

      default:
        this.vx = Math.sin(this.moveTimer * 1.5) * 60;
        this.vy = 0;
        break;
    }

    this.x += this.vx * dt;

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;

    if (this.y < 80) this.y = 80;
    if (this.y > 220) this.y = 220;

    if (this.props.spawns && this.spawnTimer >= 0) {
      this.spawnTimer += dt * 1000;
    }

    if (this.flashIntensity > 0) {
      this.flashIntensity = Math.max(0, this.flashIntensity - dt * 5);
    }

    this.rotation = (this.vx / 100) * 0.2;
  }

  canShoot() {
    if (this.props.shootChance === 0) return false;
    const shootInterval = 4 + Math.random() * 8;
    if (this.shootTimer >= shootInterval) {
      this.shootTimer = 0;
      return true;
    }
    return false;
  }

  canSpawn() {
    if (!this.props.spawns) return false;
    if (this.spawnTimer >= this.props.spawnInterval) {
      this.spawnTimer = 0;
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    if (this.armor > 0) {
      amount = Math.max(1, amount - this.armor);
    }

    if (this.shield > 0) {
      this.shield -= amount;
      if (this.shield < 0) {
        this.hp += this.shield;
        this.shield = 0;
      }
    } else {
      this.hp -= amount;
    }

    this.flashIntensity = 1;

    if (this.hp <= 0) {
      this.destroyed = true;
      return true;
    }
    return false;
  }

  draw(ctx) {
    if (this.destroyed) return;

    const engineGlow = Math.sin(this.enginePulse) * 0.3 + 0.7;
    const engineGradient = ctx.createRadialGradient(
      this.x + this.width / 2, this.y,
      0,
      this.x + this.width / 2, this.y,
      12
    );
    engineGradient.addColorStop(0, `rgba(239, 68, 68, ${engineGlow * 0.8})`);
    engineGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = engineGradient;
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y, 12, 0, Math.PI * 2);
    ctx.fill();

    if (this.flashIntensity > 0) {
      ctx.shadowBlur = 15 * this.flashIntensity;
      ctx.shadowColor = '#ffffff';
    }

    let color = this.props.color;
    if (this.hp < this.maxHp) {
      const ratio = this.hp / this.maxHp;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      color = `rgb(${Math.floor(r * (0.4 + ratio * 0.6))}, ${Math.floor(g * (0.4 + ratio * 0.6))}, ${Math.floor(b * (0.4 + ratio * 0.6))})`;
    }

    let enemyImg;
    const eliteTypes = [
      ENEMY_TYPES.ELITE,
      ENEMY_TYPES.ARMORED,
      ENEMY_TYPES.SHIELDED,
      ENEMY_TYPES.BOSS_MINION
    ];

    if (eliteTypes.includes(this.type)) {
      const ufoColors = ['Blue', 'Green', 'Red', 'Yellow'];
      const colorIndex = this.type % ufoColors.length;
      enemyImg = AssetLoader.images.bosses?.[`boss${colorIndex + 1}`];
    } else {
      enemyImg = AssetLoader.getEnemy(this.type);
    }

    if (enemyImg) {
      ctx.save();
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(Math.PI + this.rotation);
      ctx.drawImage(
        enemyImg,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
      ctx.restore();
    } else{
      const gradient = ctx.createLinearGradient(
        this.x, this.y,
        this.x, this.y + this.height
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y + this.height);
      ctx.lineTo(this.x, this.y);
      ctx.lineTo(this.x + this.width, this.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    if (this.shield > 0) {
      const shieldAlpha = (this.shield / this.maxShield) * 0.5;
      ctx.strokeStyle = `rgba(34, 197, 94, ${shieldAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2 + 8,
        0, Math.PI * 2
      );
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

class EnemyBullet {
  constructor(x, y, vx = 0, vy = CONFIG.ENEMY_BULLET_SPEED, aimed = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 10;
    this.height = 18;
    this.damage = CONFIG.ENEMY_BULLET_DAMAGE;
    this.destroyed = false;
    this.aimed = aimed;
    this.trail = [];
    this.speedMultiplier = 1;
  }

  update(dt) {
    this.x += this.vx * dt * this.speedMultiplier;
    this.y += this.vy * dt * this.speedMultiplier;

    this.trail.push({ x: this.x, y: this.y, life: 0.15 });
    if (this.trail.length > 5) {
      this.trail.shift();
    }
  }

  draw(ctx) {
    this.trail.forEach((t, i) => {
      const alpha = i / this.trail.length;
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.5})`;
      const size = this.width * 0.6 * (i / this.trail.length);
      ctx.fillRect(t.x - size / 2, t.y, size, this.height * 0.6);
    });

    ctx.fillStyle = this.aimed ? '#f97316' : '#ef4444';
    ctx.fillRect(
      this.x - this.width / 2,
      this.y,
      this.width,
      this.height
    );

    ctx.shadowBlur = 10;
    ctx.shadowColor = this.aimed ? '#f97316' : '#ef4444';
    ctx.fillRect(
      this.x - this.width / 2,
      this.y,
      this.width,
      this.height
    );
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
    this.width = 44;
    this.height = 44;
    this.vy = CONFIG.POWERUP_FALL_SPEED;
    this.rotation = 0;
    this.pulse = 0;
    this.collected = false;
    this.lifetime = CONFIG.POWERUP_LIFETIME;
    this.lifeTimer = 0;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.rotation += dt * 2.5;
    this.pulse += dt * 6;
    this.lifeTimer += dt * 1000;
  }

  draw(ctx) {
    const fadeStart = this.lifetime - 2000;
    if (this.lifeTimer > fadeStart) {
      const fadeRatio = 1 - ((this.lifeTimer - fadeStart) / 2000);
      ctx.globalAlpha = Math.max(0.3, fadeRatio);
    }

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    const powerupImg = AssetLoader.getPowerup(this.type);

    if (powerupImg) {
      ctx.drawImage(
        powerupImg,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    } else {
      const pulseSize = Math.sin(this.pulse) * 4 + this.width;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize / 2);
      gradient.addColorStop(0, this.props.color + '60');
      gradient.addColorStop(1, this.props.color + '00');
      ctx.fillStyle = gradient;
      ctx.fillRect(-pulseSize / 2, -pulseSize / 2, pulseSize, pulseSize);

      const boxGradient = ctx.createLinearGradient(
        -this.width / 2, -this.height / 2,
        this.width / 2, this.height / 2
      );
      boxGradient.addColorStop(0, this.props.color);
      boxGradient.addColorStop(0.5, '#ffffff');
      boxGradient.addColorStop(1, this.props.color);
      ctx.fillStyle = boxGradient;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

      ctx.fillStyle = '#000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.props.icon, 0, 0);
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  isExpired() {
    return this.lifeTimer >= this.lifetime;
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
  constructor(x, y, value = 10) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.width = 24;
    this.height = 24;
    this.vx = 0;
    this.vy = CONFIG.POWERUP_FALL_SPEED * 0.8;
    this.rotation = 0;
    this.sparkle = 0;
    this.collected = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += dt * 5;
    this.sparkle += dt * 8;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    if (Math.sin(this.sparkle) > 0.7) {
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-this.width / 2 - 4, 0);
      ctx.lineTo(this.width / 2 + 4, 0);
      ctx.moveTo(0, -this.height / 2 - 4);
      ctx.lineTo(0, this.height / 2 + 4);
      ctx.stroke();
    }

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
    gradient.addColorStop(0, '#fde047');
    gradient.addColorStop(0.5, '#fbbf24');
    gradient.addColorStop(1, '#f59e0b');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0);

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

class HealthBonus {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.healthRestore = 10;
    this.width = 32;
    this.height = 32;
    this.vx = 0;
    this.vy = CONFIG.POWERUP_FALL_SPEED * 0.8;
    this.rotation = 0;
    this.pulse = 0;
    this.collected = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += dt * 3;
    this.pulse += dt * 6;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    const scale = 1 + Math.sin(this.pulse) * 0.1;
    ctx.scale(scale, scale);
    ctx.rotate(this.rotation);

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fbbf24';

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
    gradient.addColorStop(0, '#fef3c7');
    gradient.addColorStop(0.4, '#fde047');
    gradient.addColorStop(1, '#f59e0b');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.shadowBlur = 3;
    ctx.shadowColor = '#dc2626';

    ctx.fillRect(-10, -3, 20, 6);
    ctx.fillRect(-3, -10, 6, 20);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#7c2d12';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+10', 0, 16);

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

class DamagePopup {
  constructor(x, y, damage) {
    this.x = x;
    this.y = y;
    this.text = `-${Math.floor(damage)}`;
    this.life = 1.0;
    this.vy = -120;
    this.alpha = 1.0;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.life -= dt;
    this.alpha = Math.max(0, this.life);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

class Boss {
  constructor(wave, config) {
    this.wave = wave;
    this.config = config;
    this.hp = config.hp;
    this.maxHp = config.hp;

    this.width = 120;
    this.height = 80;

    this.x = CONFIG.WIDTH / 2 - this.width / 2;
    this.y = -this.height - 50;
    this.targetY = 100;
    this.vx = 100;

    this.attackTimer = 0;
    this.attackInterval = 800;
    this.projectiles = [];
    this.defeated = false;
    this.entering = true;
    this.flashIntensity = 0;

    this.spamMode = false;
    this.spamDuration = 0;
    this.spamCooldown = 0;

    this.rotation = 0;
    this.pulsePhase = 0;
    this.bossNumber = Math.min(5, Math.ceil(wave / 5));
  }

  update(dt, canvasWidth, playerX, playerY) {
    if (this.entering) {
      this.y += 60 * dt;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.entering = false;
      }
      return;
    }

    if (this.isChallengeBoss && playerX !== undefined) {
      const targetX = playerX - this.width / 2;
      const dx = targetX - this.x;

      const followSpeed = 150;
      if (Math.abs(dx) > 5) {
        this.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 3, followSpeed);
        this.x += this.vx * dt;
      }
    } else {
      this.x += this.vx * dt;
    }

    if (this.x <= 0) {
      this.x = 0;
      this.vx = -this.vx;
    }
    if (this.x + this.width >= canvasWidth) {
      this.x = canvasWidth - this.width;
      this.vx = -this.vx;
    }

    this.rotation += dt * 0.5;
    this.pulsePhase += dt * 2;

    if (this.spamMode) {
      this.spamDuration -= dt;
      if (this.spamDuration <= 0) {
        this.spamMode = false;
        this.spamCooldown = 4 + Math.random() * 3;
      }
    } else {
      this.spamCooldown -= dt;
      if (this.spamCooldown <= 0) {
        this.spamMode = true;
        this.spamDuration = 2.5 + Math.random() * 1;
      }
    }

    this.attackTimer += dt * 1000;
    const currentInterval = this.spamMode ? this.attackInterval / 2 : this.attackInterval;
    if (this.attackTimer >= currentInterval) {
      this.attack(playerX, playerY);
      this.attackTimer = 0;
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      if (proj.y > CONFIG.HEIGHT + 50 || proj.y < -50 ||
          proj.x < -50 || proj.x > CONFIG.WIDTH + 50) {
        this.projectiles.splice(i, 1);
      }
    }

    if (this.flashIntensity > 0) {
      this.flashIntensity = Math.max(0, this.flashIntensity - dt * 3);
    }
  }

  attack(playerX, playerY) {
    const centerX = this.x + this.width / 2;
    const bottomY = this.y + this.height;

    if (this.isChallengeBoss) {
      for (let i = -1; i <= 1; i++) {
        const randomDirection = (Math.random() - 0.5) * 1.5 + i * 0.3;
        const randomOffset = i * 20;
        this.projectiles.push({
          x: centerX + randomOffset,
          y: bottomY,
          vx: randomDirection * 100,
          vy: 250,
          width: 24,
          height: 36,
          damage: 25,
        });
      }
      return;
    }

    const dx = playerX - centerX;
    const inaccuracy = (Math.random() - 0.5) * 80;
    const targetX = playerX + inaccuracy;
    const targetDx = targetX - centerX;

    const bulletCount = this.spamMode ? 2 : 1;

    for (let i = 0; i < bulletCount; i++) {
      const spreadOffset = this.spamMode ? (i - 0.5) * 40 : 0;
      const direction = targetDx !== 0 ? (targetDx / Math.abs(targetDx)) : 0;
      const speed = 100 + Math.abs(targetDx) * 0.3;
      const randomSpread = (Math.random() - 0.5) * 40;

      this.projectiles.push({
        x: centerX + spreadOffset,
        y: bottomY,
        vx: direction * speed + randomSpread,
        vy: 250,
        width: 24,
        height: 36,
        damage: 25,
      });
    }
  }

  hit(damage) {
    this.hp -= damage;
    this.flashIntensity = 1;

    if (this.hp <= 0) {
      this.defeated = true;
      return true;
    }
    return false;
  }

  takeDamage(damage) {
    return this.hit(damage);
  }

  draw(ctx) {
    if (this.flashIntensity > 0) {
      ctx.shadowBlur = 30 * this.flashIntensity;
      ctx.shadowColor = '#ffffff';
    }

    const bossImg = AssetLoader.getBoss(this.bossNumber);

    if (bossImg) {
      ctx.save();
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(this.rotation);

      const scale = 1 + Math.sin(this.pulsePhase) * 0.08;
      ctx.scale(scale, scale);

      ctx.drawImage(
        bossImg,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.ellipse(0, -this.height / 4, this.width / 4, this.height / 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 20;
      ctx.shadowColor = '#8b5cf6';
      ctx.fillStyle = '#c4b5fd';
      ctx.beginPath();
      ctx.ellipse(0, this.height / 3, this.width / 3, this.height / 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.shadowBlur = 0;

    const barWidth = this.width + 20;
    const barHeight = 14;
    const barX = this.x - 10;
    const barY = this.y - 30;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpRatio = this.hp / this.maxHp;
    const barColor = hpRatio > 0.6 ? '#22c55e' : hpRatio > 0.3 ? '#f59e0b' : '#ef4444';
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 3;
    ctx.shadowColor = '#000000';
    ctx.fillText('BOSS', this.x + this.width / 2, barY - 8);
    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1;

    this.projectiles.forEach(proj => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(
        proj.x - proj.width / 2,
        proj.y,
        proj.width,
        proj.height
      );

      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(
        proj.x - proj.width / 2 + 4,
        proj.y + 4,
        proj.width - 8,
        proj.height - 8
      );

      ctx.shadowBlur = 0;
    });
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
