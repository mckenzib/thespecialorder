export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum EntityType {
  PLAYER = 'PLAYER',
  PLATFORM = 'PLATFORM',
  ENEMY_ONION = 'ENEMY_ONION',
  ENEMY_CILANTRO = 'ENEMY_CILANTRO',
  ENEMY_SALT = 'ENEMY_SALT',
  ENEMY_BOSS = 'ENEMY_BOSS',
  ITEM_TACO = 'ITEM_TACO',
  POWERUP_SAUCE = 'POWERUP_SAUCE',
  PROJECTILE = 'PROJECTILE',
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
  health?: number; // For bosses or robust enemies if needed
  maxHealth?: number; // For health bars
  lifetime?: number; // For particles
  invulnerable?: number; // Frames of invulnerability
}

export interface LevelData {
  platforms: Entity[];
  enemies: Entity[];
  items: Entity[];
  startPos: Vector;
}