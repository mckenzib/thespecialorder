
import { Entity, EntityType } from '../types';
import { TILE_SIZE, COLORS, EMOJIS, BOSS_HEALTH_BASE, LEVELS } from '../constants';
import { GameState } from './types';

export class LevelManager {
  public initLevel(state: GameState, customLevel?: string[]) {
    const entities: Entity[] = [];
    let player: Entity | null = null;
    const currentIndex = state.levelIndex;
    
    const currentLevelLayout = customLevel || LEVELS[currentIndex] || LEVELS[0];

    // Dynamic Sky Color
    const skyColors = ['#87CEEB', '#FFDAB9', '#2F4F4F', '#300000']; 
    state.skyColor = skyColors[Math.floor(currentIndex / 4) % skyColors.length];

    state.bossDefeated = false;
    state.levelComplete = false;
    state.levelCompleteTimer = 0;
    state.levelTransitionTriggered = false;
    
    // Reset Powerups handled by Engine caller, but ensure internal state matches
    state.hasSauce = false;
    state.hasCoffee = false;
    state.hasWallJump = false;

    currentLevelLayout.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        const pos = { x: x * TILE_SIZE, y: y * TILE_SIZE };
        const id = `${x}-${y}`;

        if (char === '#') {
          entities.push({
            id, type: EntityType.PLATFORM, pos, size: { x: TILE_SIZE, y: TILE_SIZE },
            vel: { x: 0, y: 0 }, color: COLORS.platform
          });
        } else if (char === 'S') {
          player = {
            id: 'player', type: EntityType.PLAYER, pos, size: { x: TILE_SIZE * 0.8, y: TILE_SIZE * 0.8 },
            vel: { x: 0, y: 0 }, color: 'white', emoji: EMOJIS.player, facingRight: true
          };
        } else if (char === 'O') {
          entities.push({
            id: `onion-${id}`, type: EntityType.ENEMY_ONION, pos, size: { x: TILE_SIZE * 0.9, y: TILE_SIZE * 0.9 },
            vel: { x: -1, y: 0 }, color: 'purple', emoji: EMOJIS.onion
          });
        } else if (char === 'C') {
          entities.push({
            id: `cilantro-${id}`, type: EntityType.ENEMY_CILANTRO, pos, size: { x: TILE_SIZE * 0.8, y: TILE_SIZE * 0.8 },
            vel: { x: 0, y: 0 }, color: 'green', emoji: EMOJIS.cilantro
          });
        } else if (char === 'A') {
          entities.push({
            id: `salt-${id}`, type: EntityType.ENEMY_SALT, pos, size: { x: TILE_SIZE * 0.7, y: TILE_SIZE * 0.9 },
            vel: { x: 0, y: 0 }, color: 'white', emoji: EMOJIS.salt
          });
        } else if (['B', 'F', 'R', 'X'].includes(char)) {
          let hp = BOSS_HEALTH_BASE * (Math.floor(currentIndex / 4) + 1);
          let variant = 'SMASH';
          let emoji = EMOJIS.boss;
          let color = 'purple';
          let sizeMultiplier = 2; // Standardized smaller hitbox for all bosses

          if (char === 'F') {
              variant = 'FAST';
              emoji = EMOJIS.bossFast;
              color = 'orange';
              hp = Math.floor(hp * 0.8);
          } else if (char === 'R') {
              variant = 'RANGED';
              emoji = EMOJIS.bossRanged;
              color = 'green';
          } else if (char === 'X') {
              variant = 'FINAL';
              emoji = EMOJIS.finalBoss;
              color = 'red';
              hp += 10;
          }

          entities.push({
            id: `boss-${id}`, type: EntityType.ENEMY_BOSS, pos, 
            size: { x: TILE_SIZE * sizeMultiplier, y: TILE_SIZE * sizeMultiplier },
            vel: { x: 0, y: 0 }, 
            color: color, 
            emoji: emoji, 
            health: hp, 
            maxHealth: hp,
            aiState: 'HOVER',
            aiTimer: 0,
            variant: variant
          });
        } else if (char === 'T') {
          entities.push({
            id: `taco-${id}`, type: EntityType.ITEM_TACO, pos, size: { x: TILE_SIZE, y: TILE_SIZE },
            vel: { x: 0, y: 0 }, color: 'yellow', emoji: EMOJIS.taco
          });
        } else if (char === 'H') {
          entities.push({
            id: `sauce-${id}`, type: EntityType.POWERUP_SAUCE, pos, size: { x: TILE_SIZE * 0.8, y: TILE_SIZE * 0.8 },
            vel: { x: 0, y: 0 }, color: 'red', emoji: EMOJIS.sauce
          });
        } else if (char === 'E') {
          entities.push({
            id: `coffee-${id}`, type: EntityType.POWERUP_COFFEE, pos, size: { x: TILE_SIZE * 0.8, y: TILE_SIZE * 0.8 },
            vel: { x: 0, y: 0 }, color: 'brown', emoji: EMOJIS.coffee
          });
        } else if (char === 'W') {
          entities.push({
            id: `walljump-${id}`, type: EntityType.POWERUP_WALLJUMP, pos, size: { x: TILE_SIZE * 0.8, y: TILE_SIZE * 0.8 },
            vel: { x: 0, y: 0 }, color: 'green', emoji: EMOJIS.wallJump
          });
        }
      }
    });

    state.player = player;
    state.entities = entities;
    state.particles = [];
    state.camera = { x: 0, y: 0 };
  }
}
