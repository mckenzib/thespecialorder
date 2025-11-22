
export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  EDITOR = 'EDITOR'
}

export enum EntityType {
  PLAYER = 'PLAYER',
  PLATFORM = 'PLATFORM',
  PLATFORM_CLOUD = 'PLATFORM_CLOUD',
  PLATFORM_MOVING = 'PLATFORM_MOVING',
  ENEMY_ONION = 'ENEMY_ONION',
  ENEMY_CILANTRO = 'ENEMY_CILANTRO',
  ENEMY_SALT = 'ENEMY_SALT',
  ENEMY_BOSS = 'ENEMY_BOSS',
  ITEM_TACO = 'ITEM_TACO',
  POWERUP_SAUCE = 'POWERUP_SAUCE',
  POWERUP_COFFEE = 'POWERUP_COFFEE',
  POWERUP_WALLJUMP = 'POWERUP_WALLJUMP',
  PROJECTILE = 'PROJECTILE',
  ENEMY_PROJECTILE = 'ENEMY_PROJECTILE',
  PARTICLE = 'PARTICLE'
}

export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector;
  vel: Vector;
  size: Vector;
  color: string; // Fallback if no sprite/emoji
  emoji?: string;
  isDead?: boolean;
  grounded?: boolean;
  facingRight?: boolean;
  wallDir?: number; // -1 (left wall), 1 (right wall), 0 (none)
  health?: number; // For bosses or robust enemies if needed
  maxHealth?: number; // For health bars
  lifetime?: number; // For particles
  invulnerable?: number; // Frames of invulnerability
  aiState?: string; // For complex AI behavior
  aiTimer?: number;
  variant?: string; // 'SMASH', 'FAST', 'RANGED', 'FINAL'
  // Moving Platform Props
  moveAxis?: 'x' | 'y';
  startPos?: Vector;
  moveSpeed?: number;
  moveRange?: number;
}

export interface LevelData {
  platforms: Entity[];
  enemies: Entity[];
  items: Entity[];
  startPos: Vector;
}
