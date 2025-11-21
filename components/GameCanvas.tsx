
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
    const skyColors = ['#87CEEB', '#FFDAB9', '#2F4F4F', '#300000']; // Blue, Peach (Sunset), Dark Slate (Cave/Night), Dark Red (Boss)
    gameState.current.skyColor = skyColors[currentIndex % skyColors.length];

    gameState.current.bossDefeated = false;

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

    // Keep existing score/sauce if progressing levels, but reset if restarting L1
    if (currentIndex === 0) {
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
      pos: { x: player.pos.x + (player.size.x / 2) + (dir * 20), y: player.pos.y + player.size.y / 2 },
      size: { x: 20, y: 10 },
      vel: { x: dir * 12, y: 0 },
      color: 'red',
      emoji: '🔥',
      lifetime: 60 
    };
    gameState.current.entities.push(projectile);
  };

  const createParticles = (pos: Vector, count: number, color: string, emoji?: string) => {
    for (let i = 0; i < count; i++) {
      gameState.current.particles.push({
        id: `p-${Math.random()}`,
        type: EntityType.PARTICLE,
        pos: { x: pos.x + Math.random() * 20, y: pos.y + Math.random() * 20 },
        size: { x: 5 + Math.random() * 5, y: 5 + Math.random() * 5 },
        vel: { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 },
        color: color,
        emoji: emoji,
        lifetime: 30 + Math.random() * 20
      });
    }
  };

  const checkCollision = (r1: Entity, r2: Entity): boolean => {
    return (
      r1.pos.x < r2.pos.x + r2.size.x &&
      r1.pos.x + r1.size.x > r2.pos.x &&
      r1.pos.y < r2.pos.y + r2.size.y &&
      r1.pos.y + r1.size.y > r2.pos.y
    );
  };

  // Main Game Loop
  const update = useCallback(() => {
    if (gameState.current.status !== GameStatus.PLAYING || !gameState.current.player) return;

    const { player, entities, keys } = gameState.current;
    
    const isRunning = keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyZ'];
    const currentAccel = isRunning ? RUN_SPEED : WALK_SPEED;
    const currentMaxSpeed = isRunning ? RUN_MAX_SPEED : WALK_MAX_SPEED;

    // Calculate Dynamic Scale to Fit Height
    // We want to fit approx 16 tiles vertically (15 tiles level + 1 tile buffer)
    const desiredVisibleRows = 16;
    const scaleY = window.innerHeight / (desiredVisibleRows * TILE_SIZE);
    // Clamp scale to reasonable values (e.g. don't get too small on very wide/short screens)
    // But prioritize fitting height.
    const scale = Math.max(0.4, Math.min(2.5, scaleY));
    gameState.current.scale = scale;

    // --- Player Physics ---
    if (keys['ArrowRight'] || keys['KeyD']) {
      player.vel.x += currentAccel;
      player.facingRight = true;
    } else if (keys['ArrowLeft'] || keys['KeyA']) {
      player.vel.x -= currentAccel;
      player.facingRight = false;
    } else {
      player.vel.x *= FRICTION;
    }

    player.vel.x = Math.max(Math.min(player.vel.x, currentMaxSpeed), -currentMaxSpeed);
    player.vel.y += GRAVITY;
    player.vel.y = Math.min(player.vel.y, TERMINAL_VELOCITY);
    player.pos.x += player.vel.x;

    // Platforms X
    for (const entity of entities) {
      if (entity.type === EntityType.PLATFORM && checkCollision(player, entity)) {
        if (player.vel.x > 0) player.pos.x = entity.pos.x - player.size.x;
        else if (player.vel.x < 0) player.pos.x = entity.pos.x + entity.size.x;
        player.vel.x = 0;
      }
    }

    player.pos.y += player.vel.y;
    player.grounded = false;

    // Platforms Y
    for (const entity of entities) {
      if (entity.type === EntityType.PLATFORM && checkCollision(player, entity)) {
        if (player.vel.y > 0) {
          player.pos.y = entity.pos.y - player.size.y;
          player.grounded = true;
          player.vel.y = 0;
        } else if (player.vel.y < 0) {
          player.pos.y = entity.pos.y + entity.size.y;
          player.vel.y = 0;
        }
      }
    }

    if (player.pos.y > 2000) { // Increased death plane for safety
       onGameOver("Fell into the abyss");
       return;
    }

    // Invulnerability tick
    if (player.invulnerable && player.invulnerable > 0) {
        player.invulnerable--;
    }

    // --- Entity Interactions ---
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      if (entity.isDead) continue;

      // Enemy Movement
      if (entity.type === EntityType.ENEMY_ONION) {
        entity.pos.x += entity.vel.x;
        if (gameState.current.frameCount % 150 === 0) entity.vel.x *= -1;
      }
      
      // Boss Logic
      if (entity.type === EntityType.ENEMY_BOSS) {
          // Move towards player slowly
          const dx = player.pos.x - entity.pos.x;
          if (Math.abs(dx) > 10) {
              entity.vel.x = dx > 0 ? 1.5 : -1.5;
          }
          entity.pos.x += entity.vel.x;
          
          // Boss Jump
          if (entity.grounded && Math.random() < 0.01) {
              entity.vel.y = -15;
              entity.grounded = false;
          }
          entity.vel.y += GRAVITY;
          entity.pos.y += entity.vel.y;

          // Boss Platform Collision
          entity.grounded = false;
          for (const p of entities) {
              if (p.type === EntityType.PLATFORM && checkCollision(entity, p)) {
                  if (entity.vel.y > 0) {
                      entity.pos.y = p.pos.y - entity.size.y;
                      entity.vel.y = 0;
                      entity.grounded = true;
                  }
              }
          }
      }

      if (entity.type === EntityType.ENEMY_SALT) {
         if (gameState.current.frameCount % 120 === 0 && Math.random() > 0.5) {
            entity.vel.y = -8;
         }
         entity.vel.y += GRAVITY;
         entity.pos.y += entity.vel.y;
         for(const plat of entities) {
            if(plat.type === EntityType.PLATFORM && checkCollision(entity, plat)) {
                if(entity.vel.y > 0) {
                    entity.pos.y = plat.pos.y - entity.size.y;
                    entity.vel.y = 0;
                }
            }
         }
      }

      // Player vs Entity
      if (checkCollision(player, entity)) {
        if (entity.type === EntityType.ITEM_TACO) {
          entity.isDead = true;
          createParticles(entity.pos, 20, 'yellow', '🌮');
          onLevelComplete();
          return;
        } else if (entity.type === EntityType.POWERUP_SAUCE) {
          entity.isDead = true;
          gameState.current.hasSauce = true;
          setHasSauce(true);
          createParticles(entity.pos, 10, 'red', '🌶️');
          gameState.current.score += 100;
          setScore(gameState.current.score);
        } else if ([EntityType.ENEMY_ONION, EntityType.ENEMY_CILANTRO, EntityType.ENEMY_SALT].includes(entity.type)) {
            const hitFromAbove = player.vel.y > 0 && player.pos.y + player.size.y - player.vel.y <= entity.pos.y + entity.size.y * 0.5;
            if (hitFromAbove) {
                entity.isDead = true;
                player.vel.y = WALK_JUMP_FORCE * 0.6;
                createParticles(entity.pos, 8, entity.color, '💨');
                gameState.current.score += 200;
                setScore(gameState.current.score);
            } else if (!player.invulnerable) {
                createParticles(player.pos, 10, 'red', '💢');
                onGameOver(`Touched a raw ${entity.emoji}`);
                return;
            }
        } else if (entity.type === EntityType.ENEMY_BOSS) {
            const hitFromAbove = player.vel.y > 0 && player.pos.y + player.size.y - player.vel.y <= entity.pos.y + entity.size.y * 0.3; // Higher hitbox
            
            if (hitFromAbove && !player.invulnerable) {
                // Damage Boss
                entity.health = (entity.health || 0) - 1;
                player.vel.y = -15; // Big bounce
                player.invulnerable = 30;
                createParticles(entity.pos, 15, 'orange', '💥');
                
                if ((entity.health || 0) <= 0) {
                    entity.isDead = true;
                    gameState.current.bossDefeated = true;
                    createParticles(entity.pos, 50, 'purple', '🧅');
                    gameState.current.score += 5000;
                    // Spawn Taco
                    gameState.current.entities.push({
                         id: 'victory-taco', type: EntityType.ITEM_TACO, 
                         pos: { x: entity.pos.x, y: entity.pos.y - 100 }, 
                         size: { x: TILE_SIZE, y: TILE_SIZE },
                         vel: { x: 0, y: 0 }, color: 'yellow', emoji: EMOJIS.taco
                    });
                }
            } else if (!player.invulnerable) {
                createParticles(player.pos, 10, 'red', '💢');
                onGameOver("Crushed by the Giant Onion");
                return;
            }
        }
      }

      // Projectiles
      if (entity.type === EntityType.PROJECTILE) {
        entity.pos.x += entity.vel.x;
        entity.lifetime = (entity.lifetime || 0) - 1;
        if ((entity.lifetime || 0) <= 0) entity.isDead = true;

        for (const target of entities) {
            if (target === entity) continue;
            if (checkCollision(entity, target)) {
                 if ([EntityType.ENEMY_ONION, EntityType.ENEMY_CILANTRO, EntityType.ENEMY_SALT].includes(target.type) && !target.isDead) {
                    target.isDead = true;
                    entity.isDead = true;
                    createParticles(target.pos, 10, target.color, '💥');
                    gameState.current.score += 150;
                 } else if (target.type === EntityType.ENEMY_BOSS && !target.isDead) {
                     entity.isDead = true;
                     target.health = (target.health || 0) - 1;
                     createParticles(entity.pos, 5, 'orange');
                     if ((target.health || 0) <= 0) {
                        target.isDead = true;
                        gameState.current.bossDefeated = true;
                        createParticles(target.pos, 50, 'purple', '🧅');
                        gameState.current.score += 5000;
                        gameState.current.entities.push({
                             id: 'victory-taco', type: EntityType.ITEM_TACO, 
                             pos: { x: target.pos.x, y: target.pos.y - 100 }, 
                             size: { x: TILE_SIZE, y: TILE_SIZE },
                             vel: { x: 0, y: 0 }, color: 'yellow', emoji: EMOJIS.taco
                        });
                     }
                 } else if (target.type === EntityType.PLATFORM) {
                    entity.isDead = true;
                    createParticles(entity.pos, 3, 'gray');
                 }
            }
        }
      }
    }

    gameState.current.entities = entities.filter(e => !e.isDead);
    setScore(gameState.current.score);

    // --- Camera Logic ---
    // Calculate view dimensions in WORLD units
    const viewWidth = window.innerWidth / scale;
    const viewHeight = window.innerHeight / scale;

    // X: Track player, keeping them roughly in the left 30-40%
    const targetCamX = player.pos.x - viewWidth * 0.35;
    gameState.current.camera.x += (targetCamX - gameState.current.camera.x) * 0.1;
    gameState.current.camera.x = Math.max(0, gameState.current.camera.x);
    
    // Y: Center the level vertically if possible, or clamp
    // The level is generally 15 tiles high. 
    const levelPixelHeight = 15 * TILE_SIZE;
    
    if (viewHeight >= levelPixelHeight) {
        // Screen is taller than level, center the level
        const centeredY = (levelPixelHeight - viewHeight) / 2;
        gameState.current.camera.y = centeredY;
    } else {
        // Screen is shorter than level (rare with our scale logic, but possible if clamped)
        // Basic clamping to keep player on screen + buffer
        const targetCamY = player.pos.y - viewHeight * 0.5;
        gameState.current.camera.y += (targetCamY - gameState.current.camera.y) * 0.1;
    }

    
    // Particles
    for (let i = gameState.current.particles.length - 1; i >= 0; i--) {
        const p = gameState.current.particles[i];
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;
        p.lifetime = (p.lifetime || 0) - 1;
        if ((p.lifetime || 0) <= 0) gameState.current.particles.splice(i, 1);
    }

    gameState.current.frameCount++;
  }, [onGameOver, onLevelComplete, setScore, setHasSauce]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    const { player, entities, particles, camera, frameCount, skyColor, scale } = gameState.current;

    // Background
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    
    // APPLY SCALE
    ctx.scale(scale, scale);
    
    // APPLY CAMERA TRANSLATION
    ctx.translate(-camera.x, -camera.y);

    // Grid (Visual reference)
    // ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    // ctx.lineWidth = 1;
    // for(let x = 0; x < (canvas.width / scale) + camera.x + 1000; x+= TILE_SIZE) {
    //     ctx.beginPath(); ctx.moveTo(x, -500); ctx.lineTo(x, 2000); ctx.stroke();
    // }

    // Entities
    entities.forEach(entity => {
      if (entity.type === EntityType.ENEMY_BOSS) {
         ctx.save();
         // Boss Flash effect if low health
         if ((entity.health || 0) < 2 && frameCount % 10 < 5) {
             ctx.globalAlpha = 0.5;
         }
         ctx.font = `${entity.size.x}px Arial`;
         ctx.fillText(entity.emoji || '👹', entity.pos.x, entity.pos.y);
         
         // Boss Health Bar
         ctx.fillStyle = 'red';
         ctx.fillRect(entity.pos.x, entity.pos.y - 20, entity.size.x, 10);
         ctx.fillStyle = 'green';
         ctx.fillRect(entity.pos.x, entity.pos.y - 20, entity.size.x * ((entity.health || 0) / BOSS_HEALTH), 10);
         
         ctx.restore();
      } else if (entity.emoji) {
        ctx.font = `${entity.size.x}px Arial`;
        ctx.fillText(entity.emoji, entity.pos.x, entity.pos.y);
      } else {
        ctx.fillStyle = entity.color;
        ctx.fillRect(entity.pos.x, entity.pos.y, entity.size.x, entity.size.y);
      }
    });

    // Draw Player with Legs
    if (player) {
        ctx.save();
        const centerX = player.pos.x + player.size.x / 2;
        const centerY = player.pos.y + player.size.y / 2;
        
        ctx.translate(centerX, centerY);
        if (!player.facingRight) ctx.scale(-1, 1);
        
        // Leg Animation
        const legLength = 15;
        const isMoving = Math.abs(player.vel.x) > 0.1;
        let leftLegAngle = 0;
        let rightLegAngle = 0;

        if (!player.grounded) {
            // Jump pose
            leftLegAngle = -0.5;
            rightLegAngle = 0.5;
        } else if (isMoving) {
            // Run cycle
            const speed = Math.abs(player.vel.x) * 0.3;
            leftLegAngle = Math.sin(frameCount * speed) * 0.8;
            rightLegAngle = Math.sin(frameCount * speed + Math.PI) * 0.8;
        }

        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

        // Draw Left Leg
        ctx.beginPath();
        ctx.moveTo(-5, 10); // Hip offset
        ctx.lineTo(-5 + Math.sin(leftLegAngle) * legLength, 10 + Math.cos(leftLegAngle) * legLength);
        ctx.stroke();

        // Draw Right Leg
        ctx.beginPath();
        ctx.moveTo(5, 10);
        ctx.lineTo(5 + Math.sin(rightLegAngle) * legLength, 10 + Math.cos(rightLegAngle) * legLength);
        ctx.stroke();
        
        // Draw Emoji Head/Body
        ctx.font = `${player.size.x}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Slight bobbing
        const bobY = isMoving && player.grounded ? Math.sin(frameCount * 0.5) * 2 : 0;
        ctx.fillText(player.emoji || '👨‍🍳', 0, -5 + bobY);
        
        ctx.restore();
    }

    // Particles
    particles.forEach(p => {
        if (p.emoji) {
            ctx.font = `${p.size.x * 2}px Arial`;
            ctx.fillText(p.emoji, p.pos.x, p.pos.y);
        } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.pos.x, p.pos.y, p.size.x, p.size.y);
        }
    });

    ctx.restore();

  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [update, draw]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default GameCanvas;
