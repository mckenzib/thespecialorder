
import React, { useEffect, useRef } from 'react';
import { Entity, EntityType, Vector, GameStatus } from '../types';
import { 
  GRAVITY, FRICTION, TILE_SIZE, EMOJIS, COLORS, TERMINAL_VELOCITY, LEVELS, BOSS_HEALTH,
  WALK_SPEED, WALK_MAX_SPEED, WALK_JUMP_FORCE,
  RUN_SPEED, RUN_MAX_SPEED, RUN_JUMP_FORCE
} from '../constants';

interface GameCanvasProps {
  status: GameStatus;
  levelIndex: number;
  onGameOver: (cause: string) => void;
  onLevelComplete: () => void;
  setScore: (score: number) => void;
  setHasSauce: (has: boolean) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, levelIndex, onGameOver, onLevelComplete, setScore, setHasSauce }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable game state
  const gameState = useRef({
    player: null as Entity | null,
    entities: [] as Entity[],
    particles: [] as Entity[],
    camera: { x: 0, y: 0 },
    keys: {} as Record<string, boolean>,
    score: 0,
    hasSauce: false,
    lastShotTime: 0,
    frameCount: 0,
    status: status,
    levelIndex: levelIndex,
    bossDefeated: false,
    levelComplete: false,
    levelCompleteTimer: 0,
    skyColor: COLORS.sky,
    scale: 1
  });

  // Sync props to ref
  useEffect(() => {
    gameState.current.status = status;
    gameState.current.levelIndex = levelIndex;
  }, [status, levelIndex]);

  // Re-init level when levelIndex changes or status becomes PLAYING
  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      initLevel();
    }
  }, [levelIndex, status]);

  const initLevel = () => {
    const entities: Entity[] = [];
    let player: Entity | null = null;
    const currentIndex = gameState.current.levelIndex;
    const currentLevelLayout = LEVELS[currentIndex] || LEVELS[0];

    // Dynamic Sky Color based on level
    const skyColors = ['#87CEEB', '#FFDAB9', '#2F4F4F', '#300000']; 
    gameState.current.skyColor = skyColors[currentIndex % skyColors.length];

    gameState.current.bossDefeated = false;
    gameState.current.levelComplete = false;
    gameState.current.levelCompleteTimer = 0;

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
        } else if (char === 'B') {
          entities.push({
            id: `boss-${id}`, type: EntityType.ENEMY_BOSS, pos, size: { x: TILE_SIZE * 3, y: TILE_SIZE * 3 },
            vel: { x: -2, y: 0 }, color: 'purple', emoji: EMOJIS.onion, health: BOSS_HEALTH, maxHealth: BOSS_HEALTH
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
        }
      }
    });

    // Reset score only on first level start
    if (currentIndex === 0 && status === GameStatus.PLAYING) {
       gameState.current.score = 0;
       gameState.current.hasSauce = false;
       setScore(0);
       setHasSauce(false);
    }

    gameState.current.player = player;
    gameState.current.entities = entities;
    gameState.current.particles = [];
    gameState.current.camera = { x: 0, y: 0 };
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.current.keys[e.code] = true;
      
      if (gameState.current.levelComplete) return;

      const isRunning = gameState.current.keys['ShiftLeft'] || gameState.current.keys['ShiftRight'] || gameState.current.keys['KeyZ'];

      // Jump logic
      if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && gameState.current.player?.grounded && gameState.current.status === GameStatus.PLAYING) {
        gameState.current.player.vel.y = isRunning ? RUN_JUMP_FORCE : WALK_JUMP_FORCE;
        gameState.current.player.grounded = false;
        createParticles(gameState.current.player.pos, 5, '#fff');
      }

      // Shooting
      if (e.code === 'KeyX' && gameState.current.hasSauce && gameState.current.status === GameStatus.PLAYING) {
        const now = performance.now();
        if (now - gameState.current.lastShotTime > 300) { // Cooldown
          shootProjectile();
          gameState.current.lastShotTime = now;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [status]);

  const shootProjectile = () => {
    const { player } = gameState.current;
    if (!player) return;

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
    gameState.current.entities.push(projectile);
  };

  const createParticles = (pos: Vector, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      gameState.current.particles.push({
        id: `p-${Math.random()}`,
        type: EntityType.PARTICLE,
        pos: { ...pos },
        vel: { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 },
        size: { x: 4, y: 4 },
        color: color,
        lifetime: 30 + Math.random() * 20
      });
    }
  };

  const createConfetti = (pos: Vector) => {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
      for (let i = 0; i < 50; i++) {
        gameState.current.particles.push({
            id: `confetti-${Math.random()}`,
            type: EntityType.PARTICLE,
            pos: { x: pos.x + (Math.random() - 0.5) * 50, y: pos.y + (Math.random() - 0.5) * 50 },
            vel: { x: (Math.random() - 0.5) * 15, y: (Math.random() - 1) * 15 },
            size: { x: 6, y: 6 },
            color: colors[Math.floor(Math.random() * colors.length)],
            lifetime: 120
        });
      }
  };

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      if (gameState.current.status !== GameStatus.PLAYING) return;
      
      // --- Scaling Logic ---
      const visibleTilesHeight = 16; // Aim to show 16 tiles vertically
      const scale = window.innerHeight / (visibleTilesHeight * TILE_SIZE);
      gameState.current.scale = scale;

      // --- Level Complete Celebration Logic ---
      if (gameState.current.levelComplete) {
          gameState.current.levelCompleteTimer++;
          
          // Victory Hop
          const { player } = gameState.current;
          if (player && player.grounded && gameState.current.levelCompleteTimer % 40 === 0) {
               player.vel.y = -10;
               player.grounded = false;
          }
          if (player) {
             player.vel.y += GRAVITY;
             player.pos.y += player.vel.y;
             // Simple floor collision for victory hop
             gameState.current.entities.forEach(entity => {
                 if (entity.type === EntityType.PLATFORM && 
                     player.pos.x < entity.pos.x + entity.size.x &&
                     player.pos.x + player.size.x > entity.pos.x &&
                     player.pos.y + player.size.y <= entity.pos.y + entity.vel.y + 5 && // Tolerance
                     player.pos.y + player.size.y + player.vel.y >= entity.pos.y) {
                     player.vel.y = 0;
                     player.pos.y = entity.pos.y - player.size.y;
                     player.grounded = true;
                 }
             });
          }

          // Update particles
          gameState.current.particles.forEach(p => {
              p.pos.x += p.vel.x;
              p.pos.y += p.vel.y;
              p.vel.y += 0.2;
              if (p.lifetime) p.lifetime--;
          });
          gameState.current.particles = gameState.current.particles.filter(p => (p.lifetime || 0) > 0);

          // Longer celebration for boss level (5s) vs normal level (2s)
          const isFinalLevel = gameState.current.levelIndex === LEVELS.length - 1;
          const maxTime = isFinalLevel ? 300 : 120;

          if (gameState.current.levelCompleteTimer > maxTime) {
               onLevelComplete();
          }
          
          draw(ctx, canvas);
          animationFrameId = requestAnimationFrame(update);
          return;
      }

      const { player } = gameState.current;
      if (!player) return;

      gameState.current.frameCount++;

      // --- Player Movement ---
      const isRunning = gameState.current.keys['ShiftLeft'] || gameState.current.keys['ShiftRight'] || gameState.current.keys['KeyZ'];
      const acceleration = isRunning ? RUN_SPEED : WALK_SPEED;
      const maxSpeed = isRunning ? RUN_MAX_SPEED : WALK_MAX_SPEED;

      if (gameState.current.keys['ArrowLeft'] || gameState.current.keys['KeyA']) {
        player.vel.x -= acceleration;
        player.facingRight = false;
      }
      if (gameState.current.keys['ArrowRight'] || gameState.current.keys['KeyD']) {
        player.vel.x += acceleration;
        player.facingRight = true;
      }

      player.vel.x *= FRICTION;
      player.vel.y += GRAVITY;

      player.vel.x = Math.max(Math.min(player.vel.x, maxSpeed), -maxSpeed);
      player.vel.y = Math.min(player.vel.y, TERMINAL_VELOCITY);

      player.pos.x += player.vel.x;
      player.pos.y += player.vel.y;
      
      // Check abyss
      if (player.pos.y > (LEVELS[0].length + 5) * TILE_SIZE) {
          onGameOver("Falling into the abyss");
          return;
      }

      // --- Collision Detection ---
      player.grounded = false;

      // Platform Collision
      gameState.current.entities.forEach(entity => {
        if (entity.type === EntityType.PLATFORM) {
          // AABB Collision
          if (
            player.pos.x < entity.pos.x + entity.size.x &&
            player.pos.x + player.size.x > entity.pos.x &&
            player.pos.y < entity.pos.y + entity.size.y &&
            player.pos.y + player.size.y > entity.pos.y
          ) {
            // Simple resolution: push out based on velocity
            const prevY = player.pos.y - player.vel.y;
            
            // Landing on top
            if (prevY + player.size.y <= entity.pos.y) {
              player.pos.y = entity.pos.y - player.size.y;
              player.vel.y = 0;
              player.grounded = true;
            } 
            // Hitting head
            else if (prevY >= entity.pos.y + entity.size.y) {
              player.pos.y = entity.pos.y + entity.size.y;
              player.vel.y = 0;
            }
            // Side collisions
            else {
                const prevX = player.pos.x - player.vel.x;
                if (prevX + player.size.x <= entity.pos.x) {
                    player.pos.x = entity.pos.x - player.size.x;
                    player.vel.x = 0;
                } else if (prevX >= entity.pos.x + entity.size.x) {
                    player.pos.x = entity.pos.x + entity.size.x;
                    player.vel.x = 0;
                }
            }
          }
        } else if (entity.type === EntityType.ITEM_TACO) {
             if (checkCollision(player, entity)) {
                 gameState.current.levelComplete = true;
                 createConfetti(player.pos);
             }
        } else if (entity.type === EntityType.POWERUP_SAUCE) {
            if (checkCollision(player, entity)) {
                setHasSauce(true);
                gameState.current.hasSauce = true;
                // Remove sauce
                gameState.current.entities = gameState.current.entities.filter(e => e !== entity);
                createParticles(entity.pos, 10, 'red');
            }
        }
        // Enemy Collision
        else if ([EntityType.ENEMY_ONION, EntityType.ENEMY_CILANTRO, EntityType.ENEMY_SALT, EntityType.ENEMY_BOSS].includes(entity.type)) {
            if (checkCollision(player, entity)) {
                // Mario-style stomp
                const hitFromAbove = (player.pos.y + player.size.y) - player.vel.y <= entity.pos.y + (entity.size.y * 0.5);
                
                if (hitFromAbove && player.vel.y > 0 && entity.type !== EntityType.ENEMY_CILANTRO) {
                    player.vel.y = -10; // Bounce
                    createParticles(entity.pos, 8, entity.color);
                    
                    if (entity.type === EntityType.ENEMY_BOSS) {
                        entity.health = (entity.health || 1) - 1;
                        if (entity.health <= 0) {
                            gameState.current.bossDefeated = true;
                            gameState.current.entities = gameState.current.entities.filter(e => e !== entity);
                            // Spawn Taco
                            gameState.current.entities.push({
                                id: `taco-win`, type: EntityType.ITEM_TACO, 
                                pos: { ...entity.pos }, size: { x: TILE_SIZE, y: TILE_SIZE },
                                vel: { x: 0, y: 0 }, color: 'yellow', emoji: EMOJIS.taco
                            });
                        }
                    } else {
                        gameState.current.entities = gameState.current.entities.filter(e => e !== entity);
                        gameState.current.score += 100;
                        setScore(gameState.current.score);
                    }
                } else {
                    // Hurt
                    onGameOver(`Touched by ${entity.type.replace('ENEMY_', '')}`);
                }
            }
        }
      });

      // --- Entity Logic (Enemies, Projectiles) ---
      gameState.current.entities.forEach(entity => {
          // Projectiles
          if (entity.type === EntityType.PROJECTILE) {
              entity.pos.x += entity.vel.x;
              if (entity.lifetime) entity.lifetime--;
              
              // Hit enemies
              gameState.current.entities.forEach(target => {
                  if ([EntityType.ENEMY_ONION, EntityType.ENEMY_CILANTRO, EntityType.ENEMY_SALT, EntityType.ENEMY_BOSS].includes(target.type)) {
                      if (checkCollision(entity, target)) {
                          entity.lifetime = 0; // Kill projectile
                          
                          if (target.type === EntityType.ENEMY_BOSS) {
                              target.health = (target.health || 1) - 1;
                              createParticles(target.pos, 5, 'purple');
                               if (target.health <= 0) {
                                    gameState.current.bossDefeated = true;
                                    gameState.current.entities = gameState.current.entities.filter(e => e !== target);
                                    gameState.current.entities.push({
                                        id: `taco-win`, type: EntityType.ITEM_TACO, 
                                        pos: { ...target.pos }, size: { x: TILE_SIZE, y: TILE_SIZE },
                                        vel: { x: 0, y: 0 }, color: 'yellow', emoji: EMOJIS.taco
                                    });
                               }
                          } else {
                              gameState.current.entities = gameState.current.entities.filter(e => e !== target);
                              createParticles(target.pos, 10, target.color);
                              gameState.current.score += 100;
                              setScore(gameState.current.score);
                          }
                      }
                  }
              });
          }

          // Boss AI
          if (entity.type === EntityType.ENEMY_BOSS) {
              // Move towards player slowly
              const dx = player.pos.x - entity.pos.x;
              entity.vel.x = dx > 0 ? 1.5 : -1.5;
              entity.pos.x += entity.vel.x;
          }

          // Simple Patrol AI for others
          if (entity.type === EntityType.ENEMY_ONION) {
              entity.pos.x += entity.vel.x;
              // Turn around at simple boundaries or timers
              if (Math.random() < 0.02) entity.vel.x *= -1;
          }
      });

      // Cleanup dead particles/projectiles
      gameState.current.entities = gameState.current.entities.filter(e => (e.type !== EntityType.PROJECTILE) || (e.lifetime || 0) > 0);
      gameState.current.particles.forEach(p => {
          p.pos.x += p.vel.x;
          p.pos.y += p.vel.y;
          p.vel.y += 0.2; // Gravity for particles
          if (p.lifetime) p.lifetime--;
      });
      gameState.current.particles = gameState.current.particles.filter(p => (p.lifetime || 0) > 0);


      // --- Camera ---
      const screenWidth = canvas.width / scale;
      const screenHeight = canvas.height / scale;
      
      let camX = -player.pos.x + screenWidth * 0.3;
      let camY = -player.pos.y + screenHeight * 0.6;

      // Clamp Camera
      const levelWidth = LEVELS[0][0].length * TILE_SIZE;
      const levelHeight = LEVELS[0].length * TILE_SIZE;
      
      camX = Math.min(0, Math.max(camX, -(levelWidth - screenWidth)));
      
      if (levelHeight < screenHeight) {
           camY = (screenHeight - levelHeight) / 2;
      } else {
           camY = Math.min(0, Math.max(camY, -(levelHeight - screenHeight)));
      }

      gameState.current.camera = { x: camX, y: camY };

      draw(ctx, canvas);
      animationFrameId = requestAnimationFrame(update);
    };

    const checkCollision = (r1: Entity, r2: Entity) => {
        return (
            r1.pos.x < r2.pos.x + r2.size.x &&
            r1.pos.x + r1.size.x > r2.pos.x &&
            r1.pos.y < r2.pos.y + r2.size.y &&
            r1.pos.y + r1.size.y > r2.pos.y
        );
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const { camera, player, entities, particles, skyColor, scale } = gameState.current;
        
        // Clear and Set Background
        ctx.fillStyle = skyColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(camera.x, camera.y);

        // Draw Entities
        [...entities, player!].forEach(entity => {
            if (!entity) return;
            
            // Special Drawing for Player (Legs!)
            if (entity.type === EntityType.PLAYER) {
                const isMoving = Math.abs(entity.vel.x) > 0.1;
                const legOffset = isMoving ? Math.sin(gameState.current.frameCount * 0.5) * 5 : 0;

                // Legs
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.beginPath();
                // Left Leg
                ctx.moveTo(entity.pos.x + 10, entity.pos.y + entity.size.y - 5);
                ctx.lineTo(entity.pos.x + 10 - legOffset, entity.pos.y + entity.size.y + 5);
                // Right Leg
                ctx.moveTo(entity.pos.x + entity.size.x - 10, entity.pos.y + entity.size.y - 5);
                ctx.lineTo(entity.pos.x + entity.size.x - 10 + legOffset, entity.pos.y + entity.size.y + 5);
                ctx.stroke();

                // Body
                ctx.font = `${entity.size.x}px serif`;
                ctx.textBaseline = 'top';
                ctx.save();
                // Flip if facing left
                if (!entity.facingRight) {
                    ctx.translate(entity.pos.x + entity.size.x, entity.pos.y);
                    ctx.scale(-1, 1);
                    ctx.fillText(entity.emoji || '?', 0, 0);
                } else {
                    ctx.fillText(entity.emoji || '?', entity.pos.x, entity.pos.y);
                }
                ctx.restore();

            } else if (entity.type === EntityType.ENEMY_BOSS) {
                 // Draw Boss + Health Bar
                 ctx.font = `${entity.size.x}px serif`;
                 ctx.textBaseline = 'top';
                 ctx.fillText(entity.emoji || '?', entity.pos.x, entity.pos.y);
                 
                 // Health Bar
                 ctx.fillStyle = 'red';
                 ctx.fillRect(entity.pos.x, entity.pos.y - 20, entity.size.x, 10);
                 ctx.fillStyle = 'green';
                 const hpPct = (entity.health || 1) / (entity.maxHealth || 1);
                 ctx.fillRect(entity.pos.x, entity.pos.y - 20, entity.size.x * hpPct, 10);

            } else {
                if (entity.emoji) {
                    ctx.font = `${entity.size.x}px serif`;
                    ctx.textBaseline = 'top';
                    ctx.fillText(entity.emoji, entity.pos.x, entity.pos.y);
                } else {
                    ctx.fillStyle = entity.color;
                    ctx.fillRect(entity.pos.x, entity.pos.y, entity.size.x, entity.size.y);
                }
            }
        });

        // Draw Particles
        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.pos.x, p.pos.y, p.size.x, p.size.y);
        });

        ctx.restore();

        // UI Overlays (Celebration)
        if (gameState.current.levelComplete) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.sin(gameState.current.frameCount * 0.1) * 0.05);
            ctx.scale(scale, scale);
            
            const isFinalLevel = gameState.current.levelIndex === LEVELS.length - 1;

            if (isFinalLevel) {
                // === RAMSEY CELEBRATION ===
                
                // Text at top
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.font = 'bold 50px Fredoka One';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText("THE SPECIAL ORDER IS COMPLETE!", 0, -140);
                ctx.strokeText("THE SPECIAL ORDER IS COMPLETE!", 0, -140);
                
                ctx.font = 'bold 30px Roboto';
                ctx.fillStyle = '#fff';
                ctx.fillText("Oh wait, you found the taco.", 0, -100);

                // Draw Pixel Ramsey
                const rX = -20; 
                const rY = 20;
                
                ctx.save();
                ctx.translate(rX, rY);
                ctx.scale(3, 3); 
                
                // Hair
                ctx.fillStyle = '#E4C988'; 
                ctx.beginPath();
                ctx.moveTo(-10, -15);
                ctx.lineTo(10, -15);
                ctx.lineTo(10, -18);
                ctx.lineTo(0, -22);
                ctx.lineTo(-10, -18);
                ctx.fill();
                
                // Face
                ctx.fillStyle = '#FFCCAA';
                ctx.fillRect(-10, -15, 20, 20);
                
                // Eyes
                ctx.fillStyle = '#444';
                ctx.fillRect(-6, -8, 4, 2); 
                ctx.fillRect(2, -8, 4, 2);
                
                // Mouth (Approving)
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-4, 0);
                ctx.quadraticCurveTo(0, 3, 4, 0);
                ctx.stroke();

                // Chef Whites Body
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(-12, 5, 24, 25);
                
                // Arms Crossed
                ctx.fillStyle = '#DDDDDD';
                ctx.fillRect(-14, 8, 6, 15);
                ctx.fillRect(8, 8, 6, 15);
                ctx.fillRect(-10, 18, 20, 5);

                ctx.restore();

                // Speech Bubble
                ctx.save();
                ctx.translate(60, 0); 
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.roundRect(10, -10, 180, 60, 10);
                ctx.fill();
                ctx.stroke();
                
                // Tail
                ctx.beginPath();
                ctx.moveTo(10, 20);
                ctx.lineTo(-15, 30);
                ctx.lineTo(15, 40);
                ctx.fill();

                ctx.fillStyle = 'black';
                ctx.font = 'bold 16px Roboto';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText("Finally,", 25, 10);
                ctx.fillText("some good food.", 25, 30);

                ctx.restore();

            } else {
                // === STANDARD CELEBRATION ===
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.font = 'bold 80px Fredoka One';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText("DELICIOUS!", 0, 0);
                ctx.strokeText("DELICIOUS!", 0, 0);
                
                ctx.font = 'bold 30px Roboto';
                ctx.fillStyle = '#fff';
                ctx.fillText("Next Course Coming Up...", 0, 50);
            }
            
            ctx.restore();
        }
    };

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [onGameOver, onLevelComplete, setHasSauce, setScore]);

  return <canvas ref={canvasRef} className="block" />;
};

export default GameCanvas;
