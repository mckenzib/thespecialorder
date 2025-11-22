
import { EntityType, Entity } from '../types';
import { EMOJIS, LEVELS, TILE_SIZE } from '../constants';
import { GameState } from './types';
import { PhysicsSystem } from './PhysicsSystem';

export class AISystem {
    constructor(private physics: PhysicsSystem) { }

    public update(state: GameState) {
        const { player } = state;
        if (!player) return;

        state.entities.forEach(entity => {
            // Onion AI (Patrol)
            // PhysicsSystem now handles position updates and collisions.
            // AI just ensures velocity is correct.
            if (entity.type === EntityType.ENEMY_ONION) {
                if (entity.grounded) {
                    // If stopped (by wall or friction), start moving again
                    if (Math.abs(entity.vel.x) < 0.1) {
                        entity.vel.x = Math.random() > 0.5 ? 1 : -1;
                    }

                    // Enforce patrol speed
                    const speed = 1;
                    entity.vel.x = entity.vel.x > 0 ? speed : -speed;
                }

                // Random turn chance
                if (Math.random() < 0.02) entity.vel.x *= -1;
            }

            // Player Projectile Movement
            if (entity.type === EntityType.PROJECTILE) {
                entity.pos.x += entity.vel.x;
                if (entity.lifetime) entity.lifetime--;
            }

            // Enemy Projectile Movement (Straight shots)
            if (entity.type === EntityType.ENEMY_PROJECTILE) {
                entity.pos.x += entity.vel.x;
                entity.pos.y += entity.vel.y;
                if (entity.lifetime) entity.lifetime--;

                // Destroy on walls
                state.entities.forEach(wall => {
                    if (wall.type === EntityType.PLATFORM && this.physics.checkCollision(entity, wall)) {
                        entity.lifetime = 0;
                        this.physics.createParticles(state, entity.pos, 3, 'orange');
                    }
                });
            }

            // Boss AI
            if (entity.type === EntityType.ENEMY_BOSS) {
                this.updateBoss(entity, state);
            }
        });
    }

    private fireProjectile(state: GameState, boss: Entity, player: Entity, speed: number = 8) {
        const bossCenterX = boss.pos.x + boss.size.x / 2;
        const bossCenterY = boss.pos.y + boss.size.y / 2;
        const playerCenterX = player.pos.x + player.size.x / 2;
        const playerCenterY = player.pos.y + player.size.y / 2;

        const angle = Math.atan2(playerCenterY - bossCenterY, playerCenterX - bossCenterX);

        state.entities.push({
            id: `e-proj-${Date.now()}-${Math.random()}`,
            type: EntityType.ENEMY_PROJECTILE,
            pos: { x: bossCenterX - 7.5, y: bossCenterY - 7.5 }, // Center spawn
            size: { x: 15, y: 15 },
            vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
            color: 'orange',
            emoji: EMOJIS.badFire,
            lifetime: 120
        });
    }

    private updateBoss(entity: Entity, state: GameState) {
        const { player } = state;
        if (!player) return;

        if (!entity.aiState) {
            entity.aiState = 'HOVER';
            entity.aiTimer = 0;
        }
        entity.aiTimer = (entity.aiTimer || 0) + 1;

        // Boss Phase Logic (Half HP)
        const hpPct = (entity.health || 0) / (entity.maxHealth || 1);
        const isPhase2 = hpPct <= 0.5;

        if (entity.variant === 'FINAL' && isPhase2) {
            entity.emoji = '👹'; // Enraged Emoji

            // Minion Tossing Logic
            if (entity.aiTimer! % 90 === 0) { // Toss every ~1.5s
                const minionType = [EntityType.ENEMY_ONION, EntityType.ENEMY_SALT, EntityType.ENEMY_CILANTRO][Math.floor(Math.random() * 3)];
                const minionEmoji = minionType === EntityType.ENEMY_ONION ? EMOJIS.onion : minionType === EntityType.ENEMY_SALT ? EMOJIS.salt : EMOJIS.cilantro;
                const color = minionType === EntityType.ENEMY_ONION ? 'purple' : minionType === EntityType.ENEMY_SALT ? 'white' : 'green';

                const bossCenterX = entity.pos.x + entity.size.x / 2;
                const bossCenterY = entity.pos.y + entity.size.y / 2;

                // Toss with random arc
                const tossVelX = (Math.random() - 0.5) * 16;
                const tossVelY = -10 - Math.random() * 5;

                state.entities.push({
                    id: `minion-${Date.now()}-${Math.random()}`,
                    type: minionType,
                    pos: { x: bossCenterX - (TILE_SIZE * 0.8) / 2, y: bossCenterY },
                    size: { x: TILE_SIZE * 0.8, y: TILE_SIZE * 0.8 },
                    vel: { x: tossVelX, y: tossVelY },
                    color: color,
                    emoji: minionEmoji
                });
            }
        }

        const BOSS_HOVER_HEIGHT = 200;
        const isFast = entity.variant === 'FAST' || entity.variant === 'FINAL';
        const isRanged = entity.variant === 'RANGED' || entity.variant === 'FINAL';
        const isSmash = entity.variant === 'SMASH' || entity.variant === 'FINAL';

        // Centers
        const bossCenterX = entity.pos.x + entity.size.x / 2;
        const bossCenterY = entity.pos.y + entity.size.y / 2;
        const playerCenterX = player.pos.x + player.size.x / 2;
        const playerCenterY = player.pos.y + player.size.y / 2;

        // RANGED BEHAVIOR (Passive & Swoop Trigger)
        if (isRanged && entity.aiState === 'HOVER') {
            // Passive Shooting (Slower rate)
            const rate = (entity.variant === 'FINAL' && isPhase2) ? 45 : 90;
            if (entity.aiTimer! % 120 === rate) {
                this.fireProjectile(state, entity, player);
            }

            // TRIGGER SWOOP
            const swoopChance = isPhase2 ? 0.02 : 0.01;
            // Only swoop if not preparing another attack
            if (entity.aiTimer! > 60 && Math.random() < swoopChance) {
                entity.aiState = 'SWOOP_PREP';
                entity.aiTimer = 0;
                entity.vel.y = -4; // Hop up slightly to telegraph
            }
        }

        // MOVEMENT
        if (entity.aiState === 'HOVER') {
            // BOUNCY BOSS (Dumpling)
            if (entity.variant === 'BOUNCY') {
                // Bouncy behavior: Jump high, land, wait, repeat
                // Override standard hover logic

                // Gravity is handled by physics if we let it, but bosses are kinematic here.
                // Let's simulate "bouncing"

                // Check if "Grounded" (Velocity is near 0 and low enough)
                const isLanded = Math.abs(entity.vel.y) < 0.5 && entity.pos.y > (LEVELS[0].length * TILE_SIZE) / 2;

                if (isLanded) {
                    // On Ground
                    entity.vel.x *= 0.8; // Friction
                    if (Math.abs(entity.vel.x) < 1) entity.vel.x = 0;

                    if (entity.aiTimer! > 60) {
                        // JUMP!
                        entity.vel.y = -25; // Super high jump
                        // Aim at player
                        const dir = playerCenterX > bossCenterX ? 1 : -1;
                        entity.vel.x = dir * 10;
                        entity.aiTimer = 0;
                    }
                } else {
                    // In Air
                    entity.vel.y += 0.8; // Gravity
                }

                // Update Position manually since we are bypassing standard physics for Bosses in this loop
                // (Though we could switch to physics-based if we wanted, but this keeps it contained)

                // Simple floor clamp for boss
                const floorY = (LEVELS[0].length * TILE_SIZE) - (TILE_SIZE * 3);
                if (entity.pos.y > floorY) {
                    entity.pos.y = floorY;
                    entity.vel.y = 0;
                }
            }
            else {
                // Standard Hover Logic (Existing)
                // Track Center to Center
                const dx = playerCenterX - bossCenterX;

                // Logic for Final Boss speed curve: Slow start -> Fast finish
                let speed = isFast ? 6 : 3;
                if (entity.variant === 'FINAL') {
                    speed = isPhase2 ? 8 : 3; // Start slow (3), then go wild (8)
                }

                const targetXSpeed = dx > 0 ? speed : -speed;

                // Smooth acceleration
                entity.vel.x += (targetXSpeed - entity.vel.x) * 0.05;

                // Stop jitter when close
                if (Math.abs(dx) < 10) entity.vel.x *= 0.9;

                const targetY = Math.max(0, player.pos.y - BOSS_HOVER_HEIGHT);
                const dy = targetY - entity.pos.y;

                // Dampen reaction to jumps so player can get an angle
                // If player is jumping (moving up), track slower
                let verticalFactor = 0.05;
                if (player.vel.y < -2) {
                    verticalFactor = 0.015;
                }

                entity.vel.y = dy * verticalFactor;

                // Clamp max vertical speed to prevent snapping
                const MAX_V_SPEED = 6;
                entity.vel.y = Math.max(Math.min(entity.vel.y, MAX_V_SPEED), -MAX_V_SPEED);

                if (entity.variant === 'FAST') {
                    entity.vel.y += Math.sin(state.frameCount * 0.1) * 2;
                }

                const attackThreshold = isFast ? 80 : 120;
                if (entity.aiTimer! > attackThreshold && Math.abs(dx) < 150) {
                    if (isFast && Math.random() > 0.3) {
                        entity.aiState = 'DASH_PREP';
                    } else if (isSmash) {
                        entity.aiState = 'PREP';
                    }
                    entity.aiTimer = 0;
                }
            }
        }
        // SWOOP ATTACK (Ranged / Final)
        else if (entity.aiState === 'SWOOP_PREP') {
            entity.vel.x *= 0.9;
            if (entity.aiTimer! > 20) {
                entity.aiState = 'SWOOP';
                entity.aiTimer = 0;
            }
        }
        else if (entity.aiState === 'SWOOP') {
            // Move towards player X loosely
            const dx = playerCenterX - bossCenterX;
            entity.vel.x += (dx > 0 ? 1 : -1) * 0.5;
            entity.vel.x = Math.max(Math.min(entity.vel.x, 10), -10);

            // Dive Down Low
            const targetY = player.pos.y - 60;
            const dy = targetY - entity.pos.y;
            entity.vel.y = dy * 0.1;

            // Fire while swooping
            if (entity.aiTimer! % 15 === 0) {
                this.fireProjectile(state, entity, player, 9); // Fast projectiles
            }

            // Pull up and exit
            if (entity.aiTimer! > 60) {
                entity.aiState = 'RECOVER';
                entity.aiTimer = 0;
                entity.vel.y = -5; // Fly up
            }
        }
        // SMASH ATTACK
        else if (entity.aiState === 'PREP') {
            entity.vel.x = 0;
            entity.vel.y = 0;
            entity.pos.x += (Math.random() - 0.5) * 10;

            if (entity.aiTimer! > 40) {
                entity.aiState = 'SMASH';
                entity.vel.y = (isFast || isPhase2) ? 25 : 20;
            }
        }
        else if (entity.aiState === 'SMASH') {
            entity.vel.y += 1.5;
            entity.vel.x = 0;

            let hitGround = false;
            state.entities.forEach(other => {
                if (other.type === EntityType.PLATFORM && this.physics.checkCollision(entity, other)) {
                    if (entity.vel.y > 0 && (entity.pos.y + entity.size.y - entity.vel.y) <= other.pos.y + other.size.y / 2) {
                        hitGround = true;
                        entity.pos.y = other.pos.y - entity.size.y;
                    }
                }
            });
            // Failsafe floor
            if (entity.pos.y > (LEVELS[0].length * TILE_SIZE)) hitGround = true;

            if (hitGround) {
                entity.vel.y = 0;
                entity.aiState = 'RECOVER';
                entity.aiTimer = 0;
                this.physics.createParticles(state, { x: bossCenterX, y: entity.pos.y + entity.size.y }, 20, 'white');
            }
        }

        // DASH ATTACK
        else if (entity.aiState === 'DASH_PREP') {
            entity.vel.x = 0;
            entity.vel.y = 0;
            // Face player
            entity.pos.x += (playerCenterX > bossCenterX ? -2 : 2);

            if (entity.aiTimer! > 30) {
                entity.aiState = 'DASH';
                const dir = playerCenterX > bossCenterX ? 1 : -1;
                entity.vel.x = dir * 25;
                entity.vel.y = (playerCenterY - bossCenterY) * 0.1;
            }
        }
        else if (entity.aiState === 'DASH') {
            entity.vel.x *= 0.98;
            if (entity.aiTimer! > 40 || Math.abs(entity.vel.x) < 2) {
                entity.aiState = 'RECOVER';
                entity.aiTimer = 0;
            }
        }

        // RECOVER
        else if (entity.aiState === 'RECOVER') {
            entity.vel.x *= 0.8;
            entity.vel.y *= 0.8;
            let recoverTime = isFast ? 40 : 90;
            if (isPhase2) recoverTime /= 2; // Recover faster in phase 2

            if (entity.aiTimer! > recoverTime) {
                entity.aiState = 'HOVER';
                entity.aiTimer = 0;
            }
        }

        entity.pos.x += entity.vel.x;
        entity.pos.y += entity.vel.y;
    }
}
