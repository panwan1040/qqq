import { useState } from 'react';
import { useGameStore } from './stores/gameStore';
import { SetupScreen } from './components/SetupScreen';
import { QuestSelectionScreen } from './components/QuestSelectionScreen';
import { GameBoard } from './components/GameBoard';
import { GameOverScreen } from './components/GameOverScreen';
import MultiplayerApp from './MultiplayerApp';

function App() {
    const [mode, setMode] = useState<'menu' | 'local' | 'online'>('menu');
    const gamePhase = useGameStore(state => state.gamePhase);

    // Mode Selection Screen
    if (mode === 'menu') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text mb-4">
                        Hidden Quest
                    </h1>
                    <p className="text-slate-400 mb-8">Secret Quests • Strategic Combat • 4-6 Players</p>
                    
                    <div className="space-y-4">
                        <button
                            onClick={() => setMode('online')}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition"
                        >
                            🌐 Online Multiplayer
                        </button>
                        <button
                            onClick={() => setMode('local')}
                            className="w-full py-4 bg-slate-700 text-white rounded-xl font-semibold text-lg hover:bg-slate-600 transition"
                        >
                            🎮 Local Game (Hot Seat)
                        </button>
                    </div>
                    
                    <p className="text-slate-500 text-sm mt-8">
                        Online mode requires a server connection
                    </p>
                </div>
            </div>
        );
    }

    // Online Multiplayer Mode
    if (mode === 'online') {
        return (
            <div>
                <button
                    onClick={() => setMode('menu')}
                    className="fixed top-4 left-4 z-50 px-3 py-1 bg-slate-800/80 text-slate-400 rounded-lg text-sm hover:text-white transition"
                >
                    ← Back to Menu
                </button>
                <MultiplayerApp />
            </div>
        );
    }

    // Local Game Mode (existing functionality)
    return (
        <div>
            <button
                onClick={() => setMode('menu')}
                className="fixed top-4 left-4 z-50 px-3 py-1 bg-slate-800/80 text-slate-400 rounded-lg text-sm hover:text-white transition"
            >
                ← Back to Menu
            </button>
            {gamePhase === 'setup' && <SetupScreen />}
            {gamePhase === 'quest_selection' && <QuestSelectionScreen />}
            {gamePhase === 'playing' && <GameBoard />}
            {gamePhase === 'game_over' && <GameOverScreen />}
        </div>
    );
}

export default App;
