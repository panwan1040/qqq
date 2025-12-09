import React from 'react';
import { useGameStore } from '../stores/gameStore';

export const GameOverScreen: React.FC = () => {
    const gameState = useGameStore(state => state.gameState);
    const resetGame = useGameStore(state => state.resetGame);

    if (!gameState || !gameState.winner) return null;

    const winner = gameState.winner;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h1 className="text-4xl font-bold text-white mb-2">{winner.name} Wins!</h1>
                <p className="text-xl text-purple-400 mb-8">{winner.character?.name}</p>

                {winner.quest && (
                    <div className="bg-slate-800/80 rounded-xl p-6 mb-8 border border-amber-500/30">
                        <h3 className="text-amber-400 text-lg font-semibold mb-2">Secret Quest Completed</h3>
                        <p className="text-2xl font-bold text-white mb-2">{winner.quest.name}</p>
                        <p className="text-slate-400">{winner.quest.description}</p>
                    </div>
                )}

                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">All Players' Quests Revealed</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        {gameState.players.map(player => (
                            <div key={player.id} className={`p-4 rounded-lg ${player.id === winner.id ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-slate-800/50 border border-slate-700/50'}`}>
                                <p className="font-semibold text-white">{player.name}</p>
                                <p className="text-sm text-purple-400">{player.character?.name}</p>
                                <p className="text-sm text-slate-400 mt-1">{player.quest?.name || 'No quest'}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl text-lg">
                    Play Again
                </button>
            </div>
        </div>
    );
};
