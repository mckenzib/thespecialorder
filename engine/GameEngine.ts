
import { GameStatus, EntityType, Entity, Vector } from '../types';
import { COLORS, TILE_SIZE, RUN_SPEED, WALK_SPEED, RUN_MAX_SPEED, WALK_MAX_SPEED, RUN_JUMP_FORCE, WALK_JUMP_FORCE, LEVELS, EMOJIS, GRAVITY } from '../constants';
import { GameState, EngineCallbacks } from './types';
import { InputManager } from './InputManager';
import { LevelManager } from './LevelManager';
import { PhysicsSystem } from './PhysicsSystem';
import { RenderSystem } from './RenderSystem';
import { AISystem } from './AISystem';

export class GameEngine {
  private state: GameState;
  private input: InputManager;
  private levelManager: LevelManager;
  private physics: PhysicsSystem;
  private renderSystem: RenderSystem;
  private aiSystem: AISystem;
  private callbacks: EngineCallbacks;
  private animationFrameId: number = 0;
  private customLevel?: string[];

  constructor(callbacks: EngineCallbacks, initialLevelIndex: number) {
    this.callbacks = callbacks;
    this.input = new InputManager();
    this.levelManager = new LevelManager();
    this.physics = new PhysicsSystem();
    this.renderSystem = new RenderSystem();
    this.aiSystem = new AISystem(this.physics);

    this.state = {
      player: null,
      entities: [],
      particles: [],
      camera: { x: 0, y: 0 },
      score: 0,
      levelStartScore: 0,
      hasSauce: false,
      hasCoffee: false,
      lastShotTime: 0,
      frameCount: 0,
      status: GameStatus.MENU,
      levelIndex: initialLevelIndex,
      bossDefeated: false,
      levelComplete: false,
      levelCompleteTimer: 0,
      levelTransitionTriggered: false,
      skyColor: COLORS.sky,
      scale: 1,
      canvasWidth: 800,
      canvasHeight: 600
    };
  }

  public start(status: GameStatus, levelIndex: number, customLevel?: string[]) {
    // Prevent multiple loops (Speed Bug Fix)
    this.stop();

    this.state.status = status;
    this.customLevel = customLevel;

    if (status === GameStatus.PLAYING) {
      // Score Snapshotting Logic
      if (levelIndex === 0 && !customLevel) {
          // New Game: Reset everything
          this.state.score = 0;
          this.state.levelStartScore = 0;
      } else if (levelIndex !== this.state.levelIndex) {
          // Advanced to new level: Snapshot score
          this.state.levelStartScore = this.state.score;
      } else {
          // Retry/Same Level: Restore score from snapshot
          this.state.score = this.state.levelStartScore;
      }
      
      this.state.levelIndex = levelIndex;
      this.callbacks.setScore(this.state.score); // Sync UI
      this.levelManager.initLevel(this.state, customLevel);
    }

    this.loop();
  }

  public stop() {
    cancelAnimationFrame(this.animationFrameId);
  }

  public destroy() {
    this.stop();
    this.input.cleanup();
  }

  public updateDimensions(width: number, height: number) {
      this.state.canvasWidth = width;
      this.state.canvasHeight = height;
  }

  private loop = () => {
    if (this.state.status !== GameStatus.PLAYING) return;

    this.update();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update() {
      // Scaling Logic
      const visibleTilesHeight = 16; 
      const scale = this.state.canvasHeight / (visibleTilesHeight * TILE_SIZE);
      this.state.scale = scale;

      if (this.state.levelComplete) {
          this.handleLevelCompleteSequence();
          return;
      }

      const { player } = this.state;
      if (!player) return;

      this.state.frameCount++;
      this.handleInput(player);
      this.physics.update(this.state);
      this.aiSystem.update(this.state);
      this.handleCollisions(player);
      this.handleCamera(player);
  }

  private handleLevelCompleteSequence() {
      this.state.levelCompleteTimer++;
      const { player } = this.state;
      
      if (player && player.grounded && this.state.levelCompleteTimer % 40 === 0) {
           player.vel.y = -10;
           player.grounded = false;
      }

      if (player) {
         player.vel.y += GRAVITY;
         player.pos.y += player.vel.y;
         this.state.entities.forEach(entity => {
             if (entity.type === EntityType.PLATFORM && this.physics.checkCollision(player, entity)) {
                 const vectorY = (player.pos.y + player.size.y/2) - (entity.pos.y + entity.size.y/2);
                 if (vectorY < 0) {
                    player.vel.y = 0;
                    player.pos.y = entity.pos.y - player.size.y;
                    player.grounded = true;
                 }
             }
         });
      }

      // Update particles during celebration
      this.state.particles.forEach(p => {
          p.pos.x += p.vel.x;
          p.pos.y += p.vel.y;
          p.vel.y += 0.2;
          if (p.lifetime) p.lifetime--;
      });
      this.state.particles = this.state.particles.filter(p => (p.lifetime || 0) > 0);

      const isFinalLevel = this.state.levelIndex === LEVELS.length - 1;
      const maxTime = isFinalLevel ? 300 : 120;

      if (this.state.levelCompleteTimer > maxTime) {
           // Guard against multiple triggers
           if (!this.state.levelTransitionTriggered) {
               this.state.levelTransitionTriggered = true;
               this.callbacks.onLevelComplete();
           }
      }
  }

  private handleInput(player: Entity) {
      const hasSpeedBoost = this.state.hasCoffee;
      const isShiftHeld = this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight') || this.input.isDown('KeyZ');
      const isRunning = hasSpeedBoost && isShiftHeld;

      const acceleration = isRunning ? RUN_SPEED : WALK_SPEED;
      const maxSpeed = isRunning ? RUN_MAX_SPEED : WALK_MAX_SPEED;

      if (this.input.isDown('ArrowLeft') || this.input.isDown('KeyA')) {
        player.vel.x -= acceleration;
        player.facingRight = false;
      }
      if (this.input.isDown('ArrowRight') || this.input.isDown('KeyD')) {
        player.vel.x += acceleration;
        player.facingRight = true;
      }

      player.vel.x = Math.max(Math.min(player.vel.x, maxSpeed), -maxSpeed);

      // Jump
      if ((this.input.isDown('Space') || this.input.isDown('ArrowUp') || this.input.isDown('KeyW')) && player.grounded) {
        player.vel.y = isRunning ? RUN_JUMP_FORCE : WALK_JUMP_FORCE;
        player.grounded = false;
        this.physics.createParticles(this.state, player.pos, 5, '#fff');
      }

      // Shoot
      if (this.input.isDown('KeyX') && this.state.hasSauce) {
          const now = performance.now();
          if (now - this.state.lastShotTime > 300) {
              this.shootProjectile(player);
              this.state.lastShotTime = now;
          }
      }
  }

  private shootProjectile(player: Entity) {
      const dir = player.facingRight ? 1 : -1;
      const projectile: Entity = {
          id: `proj-${Date.now()}`,
          type: EntityType.PROJECTILE,
          pos: { x: player.pos.x + (player.size.x / 2) + (dir * 20), y: player.pos.y + player.size.y / 4 },
          size: { x: 20, y: 10 },
          vel: { x: dir * 12, y: 0 },
          color: 'red',
          emoji: '🔥',
          lifetime: 60
      };
      this.state.entities.push(projectile);
  }

  private handleCollisions(player: Entity) {
      player.grounded = false;
      const levelHeight = (this.customLevel ? this.customLevel.length : LEVELS[0].length) * TILE_SIZE;
      
      if (player.pos.y > levelHeight + 500) {
          this.callbacks.onGameOver("Falling into the abyss");
          return;
      }

      // Iterate backwards or clone to allow safe removal
      [...this.state.entities].forEach(entity => {
          // Update Invulnerability
          if (entity.invulnerable && entity.invulnerable > 0) {
              entity.invulnerable--;
          }

          // Check if entity still exists (might have been killed by projectile in same frame)
          if (!this.state.entities.find(e => e.id === entity.id)) return;

          if (entity.type === EntityType.PLATFORM) {
              if (this.physics.checkCollision(player, entity)) {
                  this.physics.resolvePlatformCollision(player, entity);
              }
          } else if (entity.type === EntityType.ITEM_TACO) {
               if (this.physics.checkCollision(player, entity)) {
                   this.state.levelComplete = true;
                   this.physics.createConfetti(this.state, player.pos);
               }
          } else if (entity.type === EntityType.POWERUP_SAUCE) {
              if (this.physics.checkCollision(player, entity)) {
                  this.callbacks.setHasSauce(true);
                  this.state.hasSauce = true;
                  this.state.entities = this.state.entities.filter(e => e !== entity);
                  this.physics.createParticles(this.state, entity.pos, 10, 'red');
              }
          } else if (entity.type === EntityType.POWERUP_COFFEE) {
              if (this.physics.checkCollision(player, entity)) {
                  this.callbacks.setHasCoffee(true);
                  this.state.hasCoffee = true;
                  this.state.entities = this.state.entities.filter(e => e !== entity);
                  this.physics.createParticles(this.state, entity.pos, 10, '#6F4E37');
              }
          } else if (entity.type === EntityType.ENEMY_PROJECTILE) {
              if (this.physics.checkCollision(player, entity)) {
                  this.callbacks.onGameOver("Burnt by Hot Sauce!");
              }
          } else if ([EntityType.ENEMY_ONION, EntityType.ENEMY_CILANTRO, EntityType.ENEMY_SALT, EntityType.ENEMY_BOSS].includes(entity.type)) {
              if (this.physics.checkCollision(player, entity)) {
                  
                  // STRICT STOMP LOGIC
                  const playerBottom = player.pos.y + player.size.y;
                  const enemyTop = entity.pos.y;
                  const penetration = playerBottom - enemyTop;
                  
                  // Condition 1: Player must be falling (vel.y > 0)
                  // Condition 2: Player's feet must be at the top section of the enemy hitbox
                  // Condition 3: Cilantro is spikey and cannot be stomped
                  
                  const isFalling = player.vel.y > 0;
                  const isTopHit = penetration < (entity.size.y * 0.75); // Adjusted for fairness
                  
                  if (isFalling && isTopHit && entity.type !== EntityType.ENEMY_CILANTRO) {
                      // BOUNCE
                      player.vel.y = -12; // Bounce up
                      player.pos.y = entity.pos.y - player.size.y - 1; // Snap ABOVE the enemy to prevent double-collision next frame
                      
                      this.physics.createParticles(this.state, entity.pos, 8, entity.color);
                      
                      // BOSS DAMAGE
                      if (entity.type === EntityType.ENEMY_BOSS) {
                          if (!entity.invulnerable) {
                              entity.health = (entity.health || 1) - 1;
                              entity.invulnerable = 30; // ~0.5s invulnerability to prevent insta-kill
                              this.physics.createParticles(this.state, entity.pos, 5, 'white'); // visual feedback
                              
                              if (entity.health <= 0) {
                                  this.killBoss(entity);
                              }
                          }
                      } else {
                          // Regular Kill
                          this.state.entities = this.state.entities.filter(e => e !== entity);
                          this.state.score += 100;
                          this.callbacks.setScore(this.state.score);
                      }
                  } else {
                      // Player Dies (Hit from side or below)
                      this.callbacks.onGameOver(`Touched by ${entity.type.replace('ENEMY_', '')}`);
                  }
              }
          }
          
          // Player Projectile vs Enemy
          if (entity.type === EntityType.PROJECTILE) {
               this.state.entities.forEach(target => {
                   if (target === entity) return;
                   
                   // Projectile vs Enemy
                   if ([EntityType.ENEMY_ONION, EntityType.ENEMY_CILANTRO, EntityType.ENEMY_SALT, EntityType.ENEMY_BOSS].includes(target.type)) {
                        if (this.physics.checkCollision(entity, target)) {
                            entity.lifetime = 0; // Kill projectile immediately
                            
                            if (target.type === EntityType.ENEMY_BOSS) {
                                if (!target.invulnerable) {
                                    target.health = (target.health || 1) - 1;
                                    target.invulnerable = 20;
                                    this.physics.createParticles(this.state, target.pos, 5, 'purple');
                                    if (target.health <= 0) {
                                        this.killBoss(target);
                                    }
                                } else {
                                    // Deflected/Absorbed visual
                                    this.physics.createParticles(this.state, entity.pos, 2, 'gray');
                                }
                            } else {
                                this.state.entities = this.state.entities.filter(e => e !== target);
                                this.physics.createParticles(this.state, target.pos, 10, target.color);
                                this.state.score += 100;
                                this.callbacks.setScore(this.state.score);
                            }
                        }
                   }
                   // Projectile vs Projectile
                   if (target.type === EntityType.ENEMY_PROJECTILE && this.physics.checkCollision(entity, target)) {
                        entity.lifetime = 0;
                        target.lifetime = 0;
                        this.physics.createParticles(this.state, target.pos, 3, 'orange');
                   }
               });
          }
      });
      
      // Cleanup dead particles/projectiles
      this.state.entities = this.state.entities.filter(e => (e.type !== EntityType.PROJECTILE && e.type !== EntityType.ENEMY_PROJECTILE) || (e.lifetime || 0) > 0);
  }

  private killBoss(entity: Entity) {
      this.state.bossDefeated = true;
      this.state.entities = this.state.entities.filter(e => e !== entity);
      this.state.entities.push({
          id: `taco-win`, type: EntityType.ITEM_TACO, 
          pos: { ...entity.pos }, size: { x: TILE_SIZE, y: TILE_SIZE },
          vel: { x: 0, y: 0 }, color: 'yellow', emoji: EMOJIS.taco
      });
  }

  private handleCamera(player: Entity) {
      const screenWidth = this.state.canvasWidth / this.state.scale;
      const screenHeight = this.state.canvasHeight / this.state.scale;
      
      let camX = -player.pos.x + screenWidth * 0.3;
      let camY = -player.pos.y + screenHeight * 0.6;

      const levelLayout = this.customLevel || LEVELS[this.state.levelIndex];
      const levelWidth = levelLayout[0].length * TILE_SIZE;
      const levelHeightPx = levelLayout.length * TILE_SIZE;
      
      camX = Math.min(0, Math.max(camX, -(levelWidth - screenWidth)));
      
      if (levelHeightPx < screenHeight) {
           camY = (screenHeight - levelHeightPx) / 2;
      } else {
           camY = Math.min(0, Math.max(camY, -(levelHeightPx - screenHeight)));
      }

      this.state.camera = { x: camX, y: camY };
  }

  public render(ctx: CanvasRenderingContext2D) {
      this.renderSystem.draw(ctx, this.state, this.customLevel);
  }
}
