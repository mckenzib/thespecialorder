
import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameStatus } from './types';
import { LEVELS, CHEF_QUOTES_VICTORY, CHEF_QUOTES_FAILURE } from './constants';

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
    setStatus(GameStatus.PLAYING);
    setChefQuote("");
  };

  const handleGameOver = (cause: string) => {
    if (status !== GameStatus.PLAYING) return;
    setStatus(GameStatus.GAME_OVER);
    setMessage("ORDER CANCELLED!");
    setDeathCause(cause);
    
    const randomQuote = CHEF_QUOTES_FAILURE[Math.floor(Math.random() * CHEF_QUOTES_FAILURE.length)];
    setChefQuote(randomQuote.replace("{{cause}}", cause.toLowerCase()));
  };

  const handleLevelComplete = () => {
    if (status !== GameStatus.PLAYING) return;

    if (levelIndex < LEVELS.length - 1) {
        // Next Level
        setLevelIndex(prev => prev + 1);
    } else {
        // Victory
        setStatus(GameStatus.VICTORY);
        setMessage("ORDER UP!");
        
        const randomQuote = CHEF_QUOTES_VICTORY[Math.floor(Math.random() * CHEF_QUOTES_VICTORY.length)];
        setChefQuote(randomQuote);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-neutral-900 overflow-hidden">
      {/* HUD */}
      {status === GameStatus.PLAYING && (
        <div className="absolute top-0 left-0 w-full p-2 md:p-4 flex justify-between items-start z-10 pointer-events-none">
          <div className="bg-black/50 text-white p-2 rounded-lg border-2 border-yellow-500 shadow-lg backdrop-blur-sm scale-90 origin-top-left md:scale-100">
            <h3 className="text-lg md:text-xl text-yellow-400 font-bold">Score: {score}</h3>
            <p className="text-xs md:text-sm text-gray-300">Level {levelIndex + 1} / {LEVELS.length}</p>
          </div>
          <div className="flex gap-2">
             {hasSauce && (
                 <div className="bg-red-600/80 text-white p-2 rounded-lg border-2 border-red-400 animate-pulse scale-90 origin-top-right md:scale-100">
                    <span className="text-lg md:text-2xl">🌶️ SAUCE</span>
                    <div className="text-[10px] md:text-xs font-bold text-center text-white/80">(Press X)</div>
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100 border-4 border-yellow-500">
            
            <div className={`h-24 md:h-32 flex items-center justify-center ${status === GameStatus.MENU ? 'bg-blue-500' : status === GameStatus.VICTORY ? 'bg-green-500' : 'bg-red-500'}`}>
                <span className="text-5xl md:text-6xl drop-shadow-lg">
                    {status === GameStatus.MENU ? '🌮' : status === GameStatus.VICTORY ? '👨‍🍳' : '🧅'}
                </span>
            </div>

            <div className="p-6 md:p-8 text-center">
              <h1 className="text-2xl md:text-4xl font-black mb-2 text-gray-800 uppercase tracking-tighter">
                {status === GameStatus.MENU ? 'The Special Order' : message}
              </h1>

              {status === GameStatus.MENU && (
                <p className="text-gray-600 mb-6 text-sm md:text-lg leading-relaxed">
                  You are a chef in a dangerous kitchen.<br/>
                  Dodge the <span className="font-bold text-purple-600">Onions</span>.<br/>
                  Fight the <span className="font-bold text-purple-900">Boss Onion</span>.<br/>
                  Get the <span className="font-bold text-yellow-600">Taco</span>!
                </p>
              )}

              {status !== GameStatus.MENU && (
                <div className="mb-6 bg-gray-100 p-4 rounded-lg border-l-4 border-gray-500 text-left">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Chef's Feedback:</p>
                    <p className="italic text-gray-800 font-medium text-sm md:text-lg">"{chefQuote}"</p>
                    {status === GameStatus.GAME_OVER && <p className="mt-2 text-red-500 text-xs md:text-sm font-bold">Cause: {deathCause}</p>}
                    <p className="mt-2 text-right text-gray-500 font-bold text-xs md:text-sm">Final Score: {score}</p>
                </div>
              )}

              <div className="space-y-3">
                  {status === GameStatus.MENU ? (
                    <button 
                        onClick={startGame}
                        className="w-full py-3 md:py-4 px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg md:text-xl rounded-lg shadow-lg"
                    >
                        START ORDER
                    </button>
                  ) : (
                    <div className="flex gap-2">
                        <button 
                            onClick={retryLevel}
                            className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm md:text-base rounded-lg shadow-md"
                        >
                            RETRY
                        </button>
                        <button 
                            onClick={startGame}
                            className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm md:text-base rounded-lg shadow-md"
                        >
                            RESTART
                        </button>
                    </div>
                  )}
                  
                  <div className="text-[10px] md:text-xs text-gray-400 mt-4 font-mono">
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
