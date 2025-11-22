
import React, { useEffect, useRef } from 'react';
import { GameStatus } from '../types';
import { GameEngine } from '../engine/GameEngine';

interface GameCanvasProps {
  status: GameStatus;
  levelIndex: number;
  customLevel?: string[];
  onGameOver: (cause: string) => void;
  onLevelComplete: () => void;
  setScore: (score: number) => void;
  setHasSauce: (has: boolean) => void;
  setHasCoffee: (has: boolean) => void;
  setHasWallJump: (has: boolean) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  status, levelIndex, customLevel, onGameOver, onLevelComplete, setScore, setHasSauce, setHasCoffee, setHasWallJump
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  
  // Create a ref to hold the latest callbacks. 
  // This prevents stale closures where the Engine calls the initial 'onGameOver' 
  // which might have had a 'status !== PLAYING' check that fails.
  const callbacksRef = useRef({ onGameOver, onLevelComplete, setScore, setHasSauce, setHasCoffee, setHasWallJump });

  // Sync the ref on every render
  useEffect(() => {
    callbacksRef.current = { onGameOver, onLevelComplete, setScore, setHasSauce, setHasCoffee, setHasWallJump };
  }, [onGameOver, onLevelComplete, setScore, setHasSauce, setHasCoffee, setHasWallJump]);

  // Initialize Engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new GameEngine({
        onGameOver: (cause) => callbacksRef.current.onGameOver(cause),
        onLevelComplete: () => callbacksRef.current.onLevelComplete(),
        setScore: (score) => callbacksRef.current.setScore(score),
        setHasSauce: (has) => callbacksRef.current.setHasSauce(has),
        setHasCoffee: (has) => callbacksRef.current.setHasCoffee(has),
        setHasWallJump: (has) => callbacksRef.current.setHasWallJump(has)
      }, levelIndex);
    }

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []); // Run once on mount

  // Prop updates
  useEffect(() => {
    if (engineRef.current) {
       // Engine handles start/restart internally logic
       engineRef.current.start(status, levelIndex, customLevel);
       
       // Force dimension update in case of resize during menu
       if (canvasRef.current) {
           engineRef.current.updateDimensions(canvasRef.current.width, canvasRef.current.height);
       }
    }
    
    return () => {
      if (status !== GameStatus.PLAYING) {
         engineRef.current?.stop();
      }
    }
  }, [status, levelIndex, customLevel]);

  // Rendering Loop
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !engineRef.current) return;

      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engineRef.current?.updateDimensions(canvas.width, canvas.height);
      };

      window.addEventListener('resize', handleResize);
      handleResize();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationId: number;
      const renderLoop = () => {
          // We delegate rendering to the engine, but we drive the loop here 
          // to ensure the canvas context is valid in the React lifecycle
          if (status === GameStatus.PLAYING || status === GameStatus.VICTORY || status === GameStatus.GAME_OVER) {
              engineRef.current?.render(ctx);
          }
          animationId = requestAnimationFrame(renderLoop);
      };
      renderLoop();

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
      };
  }, [status]);

  return <canvas ref={canvasRef} className="block" />;
};

export default GameCanvas;
