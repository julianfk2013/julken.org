// Pathfinding system - simplified since paths are predefined

class PathFinder {
  static gridToPixel(gridX, gridY) {
    return {
      x: gridX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: gridY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
    };
  }

  static pixelToGrid(x, y) {
    return {
      x: Math.floor(x / CONFIG.TILE_SIZE),
      y: Math.floor(y / CONFIG.TILE_SIZE)
    };
  }

  static getPathForMap(map) {
    // Convert grid path to pixel coordinates
    return map.pathTiles.map(tile => this.gridToPixel(tile[0], tile[1]));
  }

  static isOnPath(gridX, gridY, map) {
    return map.pathTiles.some(tile => tile[0] === gridX && tile[1] === gridY);
  }

  static distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
