
import { GameState } from './types';
import { EntityType } from '../types';
import { LEVELS } from '../constants';

export class RenderSystem {
  public draw(ctx: CanvasRenderingContext2D, state: GameState, customLevel?: string[]) {
        const { camera, player, entities, particles, skyColor, scale, canvasWidth, canvasHeight } = state;
        
        // Clear
        ctx.fillStyle = skyColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(camera.x, camera.y);

        [...entities, player!].forEach(entity => {
            if (!entity) return;
            
            if (entity.type === EntityType.PLAYER) {
                const isMoving = Math.abs(entity.vel.x) > 0.1;
                const legOffset = isMoving ? Math.sin(state.frameCount * 0.5) * 5 : 0;

                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(entity.pos.x + 10, entity.pos.y + entity.size.y - 5);
                ctx.lineTo(entity.pos.x + 10 - legOffset, entity.pos.y + entity.size.y + 5);
                ctx.moveTo(entity.pos.x + entity.size.x - 10, entity.pos.y + entity.size.y - 5);
                ctx.lineTo(entity.pos.x + entity.size.x - 10 + legOffset, entity.pos.y + entity.size.y + 5);
                ctx.stroke();

                ctx.font = `${entity.size.x}px serif`;
                ctx.textBaseline = 'top';
                ctx.save();
                if (!entity.facingRight) {
                    ctx.translate(entity.pos.x + entity.size.x, entity.pos.y);
                    ctx.scale(-1, 1);
                    ctx.fillText(entity.emoji || '?', 0, 0);
                } else {
                    ctx.fillText(entity.emoji || '?', entity.pos.x, entity.pos.y);
                }
                ctx.restore();

            } else if (entity.type === EntityType.ENEMY_BOSS) {
                 // Draw Emoji Centered
                 ctx.font = `${entity.size.x}px serif`;
                 ctx.textAlign = 'center';
                 ctx.textBaseline = 'middle';
                 
                 let shakeX = 0;
                 let shakeY = 0;
                 if (entity.aiState === 'PREP' || entity.aiState === 'DASH_PREP') {
                     shakeX = (Math.random() - 0.5) * 10;
                     shakeY = (Math.random() - 0.5) * 10;
                 }

                 ctx.fillText(
                     entity.emoji || '?', 
                     entity.pos.x + (entity.size.x / 2) + shakeX, 
                     entity.pos.y + (entity.size.y / 2) + shakeY
                 );
                 
                 // Reset Text align for other renders
                 ctx.textAlign = 'start';
                 ctx.textBaseline = 'top';
                 
                 // Health Bar
                 ctx.fillStyle = 'red';
                 ctx.fillRect(entity.pos.x, entity.pos.y - 20, entity.size.x, 10);
                 ctx.fillStyle = 'green';
                 const hpPct = (entity.health || 1) / (entity.maxHealth || 1);
                 ctx.fillRect(entity.pos.x, entity.pos.y - 20, entity.size.x * hpPct, 10);

                 // Debug Hitbox (Optional, comment out for production)
                 // ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                 // ctx.strokeRect(entity.pos.x, entity.pos.y, entity.size.x, entity.size.y);

            } else {
                if (entity.emoji) {
                    ctx.font = `${entity.size.x}px serif`;
                    ctx.textBaseline = 'top';
                    ctx.textAlign = 'start';
                    ctx.fillText(entity.emoji, entity.pos.x, entity.pos.y);
                } else {
                    ctx.fillStyle = entity.color;
                    ctx.fillRect(entity.pos.x, entity.pos.y, entity.size.x, entity.size.y);
                }
            }
        });

        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.pos.x, p.pos.y, p.size.x, p.size.y);
        });

        ctx.restore();

        // UI Overlays
        if (state.levelComplete) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            ctx.save();
            ctx.translate(canvasWidth / 2, canvasHeight / 2);
            ctx.rotate(Math.sin(state.frameCount * 0.1) * 0.05);
            ctx.scale(scale, scale);
            
            const isFinalLevel = !customLevel && state.levelIndex === LEVELS.length - 1;

            if (isFinalLevel) {
                this.drawRamseyCelebration(ctx);
            } else {
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
                ctx.fillText(customLevel ? "Test Complete!" : "Next Course Coming Up...", 0, 50);
            }
            
            ctx.restore();
        }
  }

  private drawRamseyCelebration(ctx: CanvasRenderingContext2D) {
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

      const rX = -20; 
      const rY = 20;
      
      ctx.save();
      ctx.translate(rX, rY);
      ctx.scale(3, 3); 
      
      ctx.fillStyle = '#E4C988'; 
      ctx.beginPath();
      ctx.moveTo(-10, -15);
      ctx.lineTo(10, -15);
      ctx.lineTo(10, -18);
      ctx.lineTo(0, -22);
      ctx.lineTo(-10, -18);
      ctx.fill();
      
      ctx.fillStyle = '#FFCCAA';
      ctx.fillRect(-10, -15, 20, 20);
      
      ctx.fillStyle = '#444';
      ctx.fillRect(-6, -8, 4, 2); 
      ctx.fillRect(2, -8, 4, 2);
      
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.quadraticCurveTo(0, 3, 4, 0);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-12, 5, 24, 25);
      
      ctx.fillStyle = '#DDDDDD';
      ctx.fillRect(-14, 8, 6, 15);
      ctx.fillRect(8, 8, 6, 15);
      ctx.fillRect(-10, 18, 20, 5);

      ctx.restore();

      ctx.save();
      ctx.translate(60, 0); 
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.roundRect(10, -10, 180, 60, 10);
      ctx.fill();
      ctx.stroke();
      
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
  }
}
