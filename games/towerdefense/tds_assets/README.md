# Tower Defense Assets

## Current Sprites

### Enemy Sprite Sheet
- **ScifiCritters.png** - 5x5 grid of 32x32 sci-fi enemy sprites
  - Row 0, Col 0: Gold alien (alien)
  - Row 0, Col 1: Silver robot (shielded)
  - Row 0, Col 2: Green creature (regenerator)
  - Row 0, Col 3: Blue enemy (scout)
  - Row 0, Col 4: Dark robot (splitter)
  - Row 1, Col 0: Tank vehicle (tank)
  - Plus many more variations available

### Individual Images
- **ship.png** - Flying enemy spaceship (Kenney Space Shooter)
- **alien_ufo.png** - UFO enemy (Kenney Space Shooter)

## Credits

- **ScifiCritters.png** by Stephen "Redshrike" Challener - [OpenGameArt.org](https://opengameart.org/content/3x-updated-32x32-scifi-roguelike-enemies) (CC-BY 3.0)
- **ship.png, alien_ufo.png** from Kenney Space Shooter - [Kenney.nl](https://kenney.nl) (CC0)

## Customization

To use your own enemy images:

1. Create PNG images (32x32 recommended, will be scaled)
2. Update `ENEMY_ASSETS` in `towerDefense_config.js` to point to your images
3. Update `ENEMY_STATS[type].sprite` to use your images

### Example Config:
```javascript
// For individual images:
sprite: { image: 'myAlien' }

// For sprite sheet:
sprite: { sheet: 'critters', row: 0, col: 0 }
```

## Color Reference (for matching theme)

- Alien: `#00ff88` (teal/green)
- Scout: `#ff9944` (orange)
- Tank: `#9966ff` (purple)
- Ship: `#ff66ff` (magenta)
- Shielded: `#44aaff` (light blue)
- Regenerator: `#99ff44` (lime green)
- Splitter: `#ff55cc` (hot pink)
