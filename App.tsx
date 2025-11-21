
import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameStatus } from './types';
import { getChefCommentary } from './services/geminiService';
import { LEVELS } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [score, setScore] = useState(0);
  const [hasSauce, setHasSauce] = useState(false);
  const [message, setMessage] = useState("");
  const [chefQuote, setChefQuote] = useState("Loading chef's opinion...");
  const [deathCause, setDeathCause] = useState("");
  const [levelIndex, setLevelIndex] = useState(0);

  const startGame = () => {
    setStatus(GameStatus.PLAYING);
    setScore(0);
    setHasSauce(false);
    setLevelIndex(0); // Reset to level 1
    setChefQuote("");
  };

  const retryLevel = () => {
    // Just restart the current level, keep score? 
    // Usually rogue-likes reset everything, but platformers might just restart level.
    // Let's reset the current level state only.
    setStatus(GameStatus.PLAYING);
    setChefQuote("");
  };

  const handleGameOver = (cause: string) => {
    if (status !== GameStatus.PLAYING) return;
    setStatus(GameStatus.GAME_OVER);
    setMessage("ORDER CANCELLED!");
    setDeathCause(cause);
    
    setChefQuote("The Chef is tasting your failure...");
    getChefCommentary(false, score, cause).then(setChefQuote);
  };

  const handleLevelComplete = () => {
    if (status !== GameStatus.PLAYING) return;

    if (levelIndex < LEVELS.length - 1) {
        // Next Level
        setLevelIndex(prev => prev + 1);
        // Maybe show a quick "Level 2" toast? 
        // For now, instant transition, or we could have a "Level Complete" interim state.
    } else {
        // Victory
        setStatus(GameStatus.VICTORY);
        setMessage("ORDER UP!");
        setChefQuote("The Chef is critiquing your plating...");
        getChefCommentary(true, score).then(setChefQuote);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-neutral-900 overflow-hidden">
      {/* HUD */}
      {status === GameStatus.PLAYING && (
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
          <div className="bg-black/50 text-white p-2 rounded-lg border-2 border-yellow-500 shadow-lg backdrop-blur-sm">
            <h3 className="text-xl text-yellow-400">Score: {score}</h3>
            <p className="text-sm text-gray-300">Level {levelIndex + 1} / {LEVELS.length}</p>
          </div>
          <div className="flex gap-2">
             {hasSauce && (
                 <div className="bg-red-600/80 text-white p-2 rounded-lg border-2 border-red-400 animate-pulse">
                    <span className="text-2xl">🌶️ HOT SAUCE ACTIVE</span>
                    <div className="text-xs font-bold text-center text-white/80">(Press X to Fire)</div>
                 </div>
             )}
          </div>
        </div>
      )}

      {/* Main Game Canvas */}
      <GameCanvas 
        status={status} 
        levelIndex={levelIndex}
        onGameOver={handleGameOver} 
        onLevelComplete={handleLevelComplete}
        setScore={setScore}
        setHasSauce={setHasSauce}
      />

      {/* Menu / Game Over Overlay */}
      {status !== GameStatus.PLAYING && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100 border-4 border-yellow-500">
            
            <div className={`h-32 flex items-center justify-center ${status === GameStatus.MENU ? 'bg-blue-500' : status === GameStatus.VICTORY ? 'bg-green-500' : 'bg-red-500'}`}>
                <span className="text-6xl drop-shadow-lg">
                    {status === GameStatus.MENU ? '🌮' : status === GameStatus.VICTORY ? '👨‍🍳' : '🧅'}
                </span>
            </div>

            <div className="p-8 text-center">
              <h1 className="text-4xl font-black mb-2 text-gray-800 uppercase tracking-tighter">
                {status === GameStatus.MENU ? 'The Special Order' : message}
              </h1>

              {status === GameStatus.MENU && (
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  You are a picky eater in a dangerous kitchen.<br/>
                  Dodge the <span className="font-bold text-purple-600">Onions</span>.<br/>
                  Fight the <span className="font-bold text-purple-900">Boss Onion</span>.<br/>
                  Get the <span className="font-bold text-yellow-600">Taco</span>!
                </p>
              )}

              {status !== GameStatus.MENU && (
                <div className="mb-6 bg-gray-100 p-4 rounded-lg border-l-4 border-gray-500 text-left">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Chef's Feedback:</p>
                    <p className="italic text-gray-800 font-medium text-lg">"{chefQuote}"</p>
                    {status === GameStatus.GAME_OVER && <p className="mt-2 text-red-500 text-sm font-bold">Cause: {deathCause}</p>}
                    <p className="mt-2 text-right text-gray-500 font-bold">Final Score: {score}</p>
                </div>
              )}

              <div className="space-y-3">
                  {status === GameStatus.MENU ? (
                    <button 
                        onClick={startGame}
                        className="w-full py-4 px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl rounded-lg shadow-lg"
                    >
                        START ORDER
                    </button>
                  ) : (
                    <div className="flex gap-2">
                        <button 
                            onClick={retryLevel}
                            className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-lg shadow-md"
                        >
                            RETRY LEVEL
                        </button>
                        <button 
                            onClick={startGame}
                            className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg shadow-md"
                        >
                            RESTART GAME
                        </button>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-4 font-mono">
                     Controls: ARROWS/WASD to Move • SPACE to Jump • X to Shoot • SHIFT/Z to Run
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
