
import { Entity, GameStatus, Vector } from '../types';

export interface GameState {
  player: Entity | null;
  entities: Entity[];
  particles: Entity[];
  camera: { x: number; y: number };
  score: number;
  levelStartScore: number; // Snapshot of score at beginning of level
  hasSauce: boolean;
  hasCoffee: boolean;
  hasWallJump: boolean;
  lastShotTime: number;
  frameCount: number;
  status: GameStatus;
  levelIndex: number;
  bossDefeated: boolean;
  levelComplete: boolean;
  levelCompleteTimer: number;
  levelTransitionTriggered: boolean; // Guard against multiple callbacks
  skyColor: string;
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface EngineCallbacks {
  onGameOver: (cause: string) => void;
  onLevelComplete: () => void;
  setScore: (score: number) => void;
  setHasSauce: (has: boolean) => void;
  setHasCoffee: (has: boolean) => void;
  setHasWallJump: (has: boolean) => void;
}
