
import { Entity, EntityType, Vector } from '../types';
import { GRAVITY, FRICTION, TERMINAL_VELOCITY, TILE_SIZE } from '../constants';
import { GameState } from './types';

export class PhysicsSystem {
  
  public update(state: GameState) {
    const { player, entities } = state;

    // --- PLAYER PHYSICS ---
    if (player) {
        player.vel.x *= FRICTION;
        player.vel.y += GRAVITY;
        player.vel.y = Math.min(player.vel.y, TERMINAL_VELOCITY);

        player.pos.x += player.vel.x;
        player.pos.y += player.vel.y;
    }

    // --- ENEMY PHYSICS (Onion, Salt, Cilantro) ---
    // We enable physics for these so the Boss can toss them and they land on platforms.
    entities.forEach(entity => {
        if ([EntityType.ENEMY_ONION, EntityType.ENEMY_CILANTRO, EntityType.ENEMY_SALT].includes(entity.type)) {
             // Apply Gravity
             entity.vel.y += GRAVITY;
             entity.vel.y = Math.min(entity.vel.y, TERMINAL_VELOCITY);
             
             // Apply Velocity
             entity.pos.x += entity.vel.x;
             entity.pos.y += entity.vel.y;

             // Ground Friction (if on floor)
             if (entity.grounded) {
                 entity.vel.x *= 0.9; // Slide to a stop or be controlled by AI
             }

             // Resolve Platform Collisions
             entity.grounded = false; // Assume falling unless collision proves otherwise
             state.entities.forEach(platform => {
                 if (platform.type === EntityType.PLATFORM && this.checkCollision(entity, platform)) {
                     this.resolvePlatformCollision(entity, platform);
                 }
             });
        }
    });

    // --- PARTICLE PHYSICS ---
    state.particles.forEach(p => {
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;
        p.vel.y += 0.2; 
        if (p.lifetime) p.lifetime--;
    });
    state.particles = state.particles.filter(p => (p.lifetime || 0) > 0);
  }

  public checkCollision(r1: Entity, r2: Entity): boolean {
    return (
        r1.pos.x < r2.pos.x + r2.size.x &&
        r1.pos.x + r1.size.x > r2.pos.x &&
        r1.pos.y < r2.pos.y + r2.size.y &&
        r1.pos.y + r1.size.y > r2.pos.y
    );
  }

  public resolvePlatformCollision(entity: Entity, platform: Entity) {
      const vectorX = (entity.pos.x + entity.size.x/2) - (platform.pos.x + platform.size.x/2);
      const vectorY = (entity.pos.y + entity.size.y/2) - (platform.pos.y + platform.size.y/2);
      
      const halfWidths = (entity.size.x + platform.size.x) / 2;
      const halfHeights = (entity.size.y + platform.size.y) / 2;
      
      const colX = halfWidths - Math.abs(vectorX);
      const colY = halfHeights - Math.abs(vectorY);
      
      if (colX >= colY) {
          // Vertical collision
          if (vectorY > 0) {
              // Hitting bottom (Head bonk)
              entity.pos.y += colY;
              entity.vel.y = 0;
          } else {
              // Hitting top (Landing)
              entity.pos.y -= colY;
              entity.vel.y = 0;
              entity.grounded = true;
          }
      } else {
          // Horizontal collision
          if (vectorX > 0) {
              // Hitting right side
              entity.pos.x += colX;
              entity.vel.x = 0;
          } else {
              // Hitting left side
              entity.pos.x -= colX;
              entity.vel.x = 0;
          }
      }
  }

  public createParticles(state: GameState, pos: Vector, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        id: `p-${Math.random()}`,
        type: EntityType.PARTICLE,
        pos: { ...pos },
        vel: { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 },
        size: { x: 4, y: 4 },
        color: color,
        lifetime: 30 + Math.random() * 20
      });
    }
  }

  public createConfetti(state: GameState, pos: Vector) {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
      for (let i = 0; i < 50; i++) {
        state.particles.push({
            id: `confetti-${Math.random()}`,
            type: EntityType.PARTICLE,
            pos: { x: pos.x + (Math.random() - 0.5) * 50, y: pos.y + (Math.random() - 0.5) * 50 },
            vel: { x: (Math.random() - 0.5) * 15, y: (Math.random() - 1) * 15 },
            size: { x: 6, y: 6 },
            color: colors[Math.floor(Math.random() * colors.length)],
            lifetime: 120
        });
      }
  }
}
