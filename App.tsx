
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameStatus } from './types';
import { LEVELS, CHEF_QUOTES_VICTORY, CHEF_QUOTES_FAILURE } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [score, setScore] = useState(0);
  const [hasSauce, setHasSauce] = useState(false);
  const [hasCoffee, setHasCoffee] = useState(false);
  const [message, setMessage] = useState("");
  const [chefQuote, setChefQuote] = useState("Loading chef's opinion...");
  const [deathCause, setDeathCause] = useState("");
  const [levelIndex, setLevelIndex] = useState(0);
  const [isTouch, setIsTouch] = useState(false);
  
  // Editor State
  // Initialize with formatted string array
  const [editorText, setEditorText] = useState(LEVELS[0].map(r => `"${r}"`).join(',\n'));
  const [isTesting, setIsTesting] = useState(false);
  const [customLevel, setCustomLevel] = useState<string[] | undefined>(undefined);

  // Detect Touch Device
  useEffect(() => {
    const checkTouch = () => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };
    setIsTouch(checkTouch());
  }, []);

  const startGame = () => {
    setStatus(GameStatus.PLAYING);
    setScore(0);
    setHasSauce(false);
    setHasCoffee(false);
    setLevelIndex(0); // Reset to level 1
    setChefQuote("");
    setIsTesting(false);
    setCustomLevel(undefined);
  };

  const startEditor = () => {
      setStatus(GameStatus.EDITOR);
      setIsTesting(false);
  };

  const loadLevelInEditor = (index: number) => {
      if (LEVELS[index]) {
          // Format as JS String Array: "string",
          setEditorText(LEVELS[index].map(r => `"${r}"`).join(',\n'));
      }
  };

  const testLevel = () => {
      const lines = editorText.split('\n');
      const parsedLevel: string[] = [];
      let valid = true;

      for (let line of lines) {
          let trimmed = line.trim();
          if (!trimmed) continue; // Skip empty lines
          
          // Remove trailing comma if present
          if (trimmed.endsWith(',')) {
              trimmed = trimmed.slice(0, -1).trim();
          }

          // Check if wrapped in quotes
          const firstChar = trimmed.charAt(0);
          const lastChar = trimmed.charAt(trimmed.length - 1);
          
          // Support both single and double quotes
          if ((firstChar === '"' && lastChar === '"') || (firstChar === "'" && lastChar === "'")) {
              // Extract content between quotes
              parsedLevel.push(trimmed.slice(1, -1));
          } else {
              // If it's not a comment, it's invalid
              if (!trimmed.startsWith('//')) {
                  valid = false;
                  break;
              }
          }
      }

      if (!valid || parsedLevel.length === 0) {
          alert("Invalid Level Format!\n\nEnsure each row is a string enclosed in quotes.\n\nExample:\n\"   T   \",\n\"  ###  \"");
          return;
      }

      setCustomLevel(parsedLevel);
      setIsTesting(true);
      setScore(0);
      setHasSauce(false);
      setHasCoffee(false);
      setLevelIndex(0); // Default to first environment for testing
      setStatus(GameStatus.PLAYING);
  };

  const stopTesting = () => {
      setStatus(GameStatus.EDITOR);
      setIsTesting(false);
  };

  const retryLevel = () => {
    setStatus(GameStatus.PLAYING);
    setChefQuote("");
    // Reset Powerups on retry so HUD matches Engine state
    setHasSauce(false);
    setHasCoffee(false);
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

    // Reset Powerups between levels
    setHasSauce(false);
    setHasCoffee(false);

    if (isTesting) {
        setStatus(GameStatus.VICTORY);
        setMessage("TEST PASSED!");
        const randomQuote = CHEF_QUOTES_VICTORY[Math.floor(Math.random() * CHEF_QUOTES_VICTORY.length)];
        setChefQuote(randomQuote);
        return;
    }

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

  // Helper to simulate keyboard events for touch controls
  const dispatchKey = (code: string, type: 'keydown' | 'keyup') => {
    window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
  };

  return (
    <div className="relative w-screen h-screen bg-neutral-900 overflow-hidden select-none">
      {/* HUD */}
      {status === GameStatus.PLAYING && (
        <div className="absolute top-0 left-0 w-full p-2 md:p-4 flex justify-between items-start z-10 pointer-events-none">
          <div className="bg-black/50 text-white p-2 rounded-lg border-2 border-yellow-500 shadow-lg backdrop-blur-sm scale-90 origin-top-left md:scale-100">
            <h3 className="text-lg md:text-xl text-yellow-400 font-bold">{isTesting ? 'TEST MODE' : `Score: ${score}`}</h3>
            {!isTesting && <p className="text-xs md:text-sm text-gray-300">Level {levelIndex + 1} / {LEVELS.length}</p>}
          </div>
          
          {/* Editor Button in HUD */}
          {isTesting && (
              <div className="pointer-events-auto">
                  <button 
                      onClick={stopTesting}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded shadow-lg border-2 border-red-400"
                  >
                      🛑 EDIT
                  </button>
              </div>
          )}

          <div className="flex gap-2">
             {hasCoffee && (
                 <div className="bg-amber-800/80 text-white p-2 rounded-lg border-2 border-amber-600 animate-pulse scale-90 origin-top-right md:scale-100">
                    <span className="text-lg md:text-2xl">☕ BOOST</span>
                    <div className="text-[10px] md:text-xs font-bold text-center text-white/80">{isTouch ? '(Hold B)' : '(Hold Shift)'}</div>
                 </div>
             )}
             {hasSauce && (
                 <div className="bg-red-600/80 text-white p-2 rounded-lg border-2 border-red-400 animate-pulse scale-90 origin-top-right md:scale-100">
                    <span className="text-lg md:text-2xl">🌶️ SAUCE</span>
                    <div className="text-[10px] md:text-xs font-bold text-center text-white/80">{isTouch ? '(Tap B)' : '(Press X)'}</div>
                 </div>
             )}
          </div>
        </div>
      )}

      {/* Main Game Canvas */}
      <GameCanvas 
        status={status} 
        levelIndex={levelIndex}
        customLevel={customLevel}
        onGameOver={handleGameOver} 
        onLevelComplete={handleLevelComplete}
        setScore={setScore}
        setHasSauce={setHasSauce}
        setHasCoffee={setHasCoffee}
      />

      {/* Touch Controls Overlay */}
      {status === GameStatus.PLAYING && isTouch && (
        <div className="absolute bottom-6 left-0 w-full px-6 flex justify-between items-end z-30 pointer-events-none no-select">
            {/* D-Pad */}
            <div className="flex gap-4 pointer-events-auto">
                <button 
                    className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full border-2 border-white/30 active:bg-white/30 flex items-center justify-center text-4xl shadow-lg active:scale-95 transition-transform touch-none"
                    onTouchStart={(e) => { e.preventDefault(); dispatchKey('ArrowLeft', 'keydown'); }}
                    onTouchEnd={(e) => { e.preventDefault(); dispatchKey('ArrowLeft', 'keyup'); }}
                    onMouseDown={(e) => { e.preventDefault(); dispatchKey('ArrowLeft', 'keydown'); }} // Fallback for testing on desktop
                    onMouseUp={(e) => { e.preventDefault(); dispatchKey('ArrowLeft', 'keyup'); }}
                >
                    ⬅️
                </button>
                <button 
                    className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full border-2 border-white/30 active:bg-white/30 flex items-center justify-center text-4xl shadow-lg active:scale-95 transition-transform touch-none"
                    onTouchStart={(e) => { e.preventDefault(); dispatchKey('ArrowRight', 'keydown'); }}
                    onTouchEnd={(e) => { e.preventDefault(); dispatchKey('ArrowRight', 'keyup'); }}
                    onMouseDown={(e) => { e.preventDefault(); dispatchKey('ArrowRight', 'keydown'); }}
                    onMouseUp={(e) => { e.preventDefault(); dispatchKey('ArrowRight', 'keyup'); }}
                >
                    ➡️
                </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 items-end pointer-events-auto pb-2">
                {/* B Button (Run/Shoot) */}
                <button 
                    className={`w-16 h-16 mb-4 backdrop-blur-sm rounded-full border-2 flex items-center justify-center text-xl font-bold text-white shadow-lg active:scale-95 transition-transform touch-none ${hasCoffee || hasSauce ? 'bg-red-500/60 border-red-400' : 'bg-gray-500/40 border-gray-400/60'}`}
                    onTouchStart={(e) => { 
                        e.preventDefault(); 
                        dispatchKey('ShiftLeft', 'keydown'); // Run
                        dispatchKey('KeyX', 'keydown'); // Shoot
                    }}
                    onTouchEnd={(e) => { 
                        e.preventDefault(); 
                        dispatchKey('ShiftLeft', 'keyup'); 
                        dispatchKey('KeyX', 'keyup'); 
                    }}
                >
                    B
                </button>
                {/* A Button (Jump) */}
                <button 
                    className="w-20 h-20 bg-green-500/40 backdrop-blur-sm rounded-full border-2 border-green-400/60 active:bg-green-500/60 flex items-center justify-center text-2xl font-bold text-white shadow-lg active:scale-95 transition-transform touch-none"
                    onTouchStart={(e) => { e.preventDefault(); dispatchKey('ArrowUp', 'keydown'); }}
                    onTouchEnd={(e) => { e.preventDefault(); dispatchKey('ArrowUp', 'keyup'); }}
                >
                    A
                </button>
            </div>
        </div>
      )}
      
      {/* Editor Overlay */}
      {status === GameStatus.EDITOR && (
          <div className="absolute inset-0 bg-neutral-900 text-white flex flex-col p-4 z-50 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                  <h1 className="text-xl md:text-2xl font-bold text-yellow-400">LEVEL EDITOR</h1>
                  <div className="flex gap-2">
                      <select 
                        className="bg-gray-700 text-white p-2 rounded text-sm"
                        onChange={(e) => loadLevelInEditor(parseInt(e.target.value))}
                        defaultValue=""
                      >
                          <option value="" disabled>Load Template...</option>
                          {LEVELS.map((_, i) => <option key={i} value={i}>Level {i + 1}</option>)}
                      </select>
                      <button onClick={testLevel} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-bold text-sm">
                          TEST LEVEL
                      </button>
                      <button onClick={() => setStatus(GameStatus.MENU)} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold text-sm">
                          EXIT
                      </button>
                  </div>
              </div>
              <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                  <textarea 
                    className="flex-1 bg-black font-mono text-xs md:text-sm p-4 text-green-400 border border-gray-700 rounded resize-none focus:outline-none focus:border-yellow-500 whitespace-pre overflow-auto"
                    value={editorText}
                    onChange={(e) => setEditorText(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="md:w-64 bg-gray-800 p-4 rounded overflow-y-auto text-xs text-gray-300">
                      <h3 className="font-bold text-white mb-2">LEGEND</h3>
                      <ul className="space-y-1">
                          <li><span className="text-yellow-500 font-mono">#</span> Platform</li>
                          <li><span className="text-white font-mono">S</span> Start Position</li>
                          <li><span className="text-yellow-400 font-mono">T</span> Taco (Goal)</li>
                          <li><span className="text-purple-400 font-mono">O</span> Onion Enemy</li>
                          <li><span className="text-green-400 font-mono">C</span> Cilantro Enemy</li>
                          <li><span className="text-white font-mono">A</span> Salt Enemy</li>
                          <li><span className="text-red-500 font-mono">B</span> Smash Boss</li>
                          <li><span className="text-orange-500 font-mono">F</span> Fast Boss</li>
                          <li><span className="text-green-500 font-mono">R</span> Ranged Boss</li>
                          <li><span className="text-red-600 font-mono">X</span> Final Boss</li>
                          <li><span className="text-red-400 font-mono">H</span> Hot Sauce (Shoot)</li>
                          <li><span className="text-amber-600 font-mono">E</span> Espresso (Run)</li>
                          <li><span className="text-gray-500 font-mono">space</span> Empty Air</li>
                      </ul>
                      <p className="mt-4 text-gray-400 italic">
                          Format: Comma-separated strings enclosed in double quotes.
                          <br/><br/>
                          Example:<br/>
                          "   T   ",<br/>
                          "  ###  ",<br/>
                          "S      "
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* Menu / Game Over Overlay */}
      {status !== GameStatus.PLAYING && status !== GameStatus.EDITOR && (
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
                <div className="text-gray-600 mb-6 text-sm md:text-lg leading-relaxed">
                  <p>You are a chef in a dangerous kitchen.</p>
                  <p>Dodge the <span className="font-bold text-purple-600">Onions</span>.</p>
                  <p>Grab the <span className="font-bold text-amber-800">Coffee</span> to Sprint!</p>
                  <p>Get the <span className="font-bold text-yellow-600">Taco</span>!</p>
                  <p className="mt-2 text-xs text-gray-400">Controls: Arrows to Move/Jump. Shift to Run. X to Shoot.</p>
                </div>
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
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={startGame}
                            className="w-full py-3 md:py-4 px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg md:text-xl rounded-lg shadow-lg active:scale-95 transition-transform"
                        >
                            START ORDER
                        </button>
                        <button 
                            onClick={startEditor}
                            className="w-full py-2 px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-transform"
                        >
                            LEVEL EDITOR
                        </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                        <button 
                            onClick={retryLevel}
                            className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm md:text-base rounded-lg shadow-md active:scale-95 transition-transform"
                        >
                            RETRY
                        </button>
                        <button 
                            onClick={isTesting ? stopTesting : startGame}
                            className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm md:text-base rounded-lg shadow-md active:scale-95 transition-transform"
                        >
                            {isTesting ? "EDIT LEVEL" : "RESTART"}
                        </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
