import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

export const SetupScreen: React.FC = () => {
    const [playerCount, setPlayerCount] = useState(4);
    const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
    const initGame = useGameStore(state => state.initGame);
    const loadGame = useGameStore(state => state.loadGame);
    const errorMessage = useGameStore(state => state.errorMessage);

    const handlePlayerCountChange = (count: number) => {
        setPlayerCount(count);
        const names = Array.from({ length: count }, (_, i) =>
            playerNames[i] || `Player ${i + 1}`
        );
        setPlayerNames(names);
    };

    const handleNameChange = (index: number, name: string) => {
        const newNames = [...playerNames];
        newNames[index] = name;
        setPlayerNames(newNames);
    };

    const handleStartGame = () => {
        initGame(playerNames);
    };

    const handleLoadGame = () => {
        loadGame();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 text-transparent bg-clip-text mb-2">
                        Hidden Quest
                    </h1>
                    <p className="text-slate-400 text-lg">Social Deduction Board Game</p>
                </div>

                {/* Setup Card */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700/50">
                    <h2 className="text-2xl font-semibold text-white mb-6">New Game Setup</h2>

                    {/* Player Count */}
                    <div className="mb-6">
                        <label className="block text-slate-300 mb-3 font-medium">Number of Players</label>
                        <div className="flex gap-2">
                            {[4, 5, 6].map(count => (
                                <button
                                    key={count}
                                    onClick={() => handlePlayerCountChange(count)}
                                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${playerCount === count
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Player Names */}
                    <div className="mb-8">
                        <label className="block text-slate-300 mb-3 font-medium">Player Names</label>
                        <div className="space-y-3">
                            {playerNames.map((name, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    value={name}
                                    onChange={(e) => handleNameChange(index, e.target.value)}
                                    placeholder={`Player ${index + 1}`}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            {errorMessage}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleStartGame}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            Start New Game
                        </button>
                        <button
                            onClick={handleLoadGame}
                            className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-all duration-200"
                        >
                            Load Saved Game
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-sm mt-6">
                    4-6 Players • Social Deduction • Hidden Quests
                </p>
            </div>
        </div>
    );
};
