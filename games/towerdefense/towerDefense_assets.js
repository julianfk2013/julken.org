// Asset loader for enemy sprites and images

class AssetLoader {
  constructor() {
    this.images = {};
    this.spriteSheets = {};
    this.loaded = false;
    this.loadingPromise = null;
  }

  async loadAll() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this._loadAssets();
    return this.loadingPromise;
  }

  async _loadAssets() {
    const promises = [];

    // Load sprite sheets (with background removal)
    for (const [name, config] of Object.entries(ENEMY_ASSETS.spriteSheets)) {
      promises.push(this._loadImage(config.src, true).then(img => {
        this.spriteSheets[name] = {
          image: img,
          tileSize: config.tileSize,
          cols: config.cols,
          rows: config.rows
        };
      }));
    }

    // Load individual images
    for (const [name, src] of Object.entries(ENEMY_ASSETS.images)) {
      promises.push(this._loadImage(src).then(img => {
        this.images[name] = img;
      }));
    }

    await Promise.all(promises);
    this.loaded = true;
    console.log('All enemy assets loaded');
  }

  _loadImage(src, removeBackground = false) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (removeBackground) {
          // Remove cyan/teal background color
          resolve(this._removeBackgroundColor(img));
        } else {
          resolve(img);
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load image: ${src}`);
        resolve(null); // Resolve with null to not break the game
      };
      img.src = src;
    });
  }

  // Remove background color from sprite sheet
  _removeBackgroundColor(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Sample background color from corner (0,0)
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if pixel matches background color (with tolerance)
      const tolerance = 25;
      const matchesBg = (
        Math.abs(r - bgR) < tolerance &&
        Math.abs(g - bgG) < tolerance &&
        Math.abs(b - bgB) < tolerance
      );

      if (matchesBg) {
        data[i + 3] = 0; // Make transparent
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Create new image from canvas
    const newImg = new Image();
    newImg.src = canvas.toDataURL();
    return newImg;
  }

  // Get sprite from sprite sheet
  getSprite(sheetName, row, col) {
    const sheet = this.spriteSheets[sheetName];
    if (!sheet || !sheet.image) return null;

    return {
      image: sheet.image,
      sx: col * sheet.tileSize,
      sy: row * sheet.tileSize,
      sw: sheet.tileSize,
      sh: sheet.tileSize
    };
  }

  // Get individual image
  getImage(name) {
    return this.images[name] || null;
  }

  // Draw enemy sprite with proper sizing and effects
  drawEnemySprite(ctx, enemyStats, x, y, size, options = {}) {
    const spriteConfig = enemyStats.sprite;
    if (!spriteConfig) return false;

    let sprite = null;
    let img = null;

    if (spriteConfig.sheet) {
      sprite = this.getSprite(spriteConfig.sheet, spriteConfig.row, spriteConfig.col);
      if (!sprite || !sprite.image) return false;
    } else if (spriteConfig.image) {
      img = this.getImage(spriteConfig.image);
      if (!img) return false;
    }

    const drawSize = size * 2.5; // Scale up sprite for visibility

    ctx.save();

    // Apply glow effect
    if (options.glow) {
      ctx.shadowColor = enemyStats.color;
      ctx.shadowBlur = 10;
    }

    // Apply tint for effects (slow, burning, etc.)
    if (options.tint) {
      ctx.globalAlpha = 0.8;
    }

    if (sprite) {
      // Draw from sprite sheet
      ctx.drawImage(
        sprite.image,
        sprite.sx, sprite.sy, sprite.sw, sprite.sh,
        x - drawSize / 2, y - drawSize / 2, drawSize, drawSize
      );
    } else if (img) {
      // Draw individual image
      ctx.drawImage(
        img,
        x - drawSize / 2, y - drawSize / 2, drawSize, drawSize
      );
    }

    ctx.restore();
    return true;
  }
}

// Global asset loader instance
const assetLoader = new AssetLoader();
