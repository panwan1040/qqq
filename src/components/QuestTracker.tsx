import React from 'react';
import { useGameStore } from '../stores/gameStore';

export const QuestTracker: React.FC = () => {
    const gameState = useGameStore(state => state.gameState);

    if (!gameState) return null;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.quest || !currentPlayer.questProgress) return null;

    const { quest, questProgress } = currentPlayer;

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-amber-500/30">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📜</span>
                <h3 className="text-lg font-semibold text-amber-400">Your Secret Quest</h3>
                <span className="ml-auto px-2 py-1 bg-amber-500/20 rounded-full text-amber-300 text-xs">
                    🔒 Hidden
                </span>
            </div>

            {/* Quest Name */}
            <h4 className="text-xl font-bold text-white mb-2">{quest.name}</h4>
            <p className="text-slate-400 mb-4">{quest.description}</p>

            {/* Progress Bars */}
            <div className="space-y-3">
                {quest.conditions.map((condition, index) => {
                    const current = questProgress.currentValues[index];
                    const target = quest.targetValues[index];
                    const percentage = Math.min((current / target) * 100, 100);
                    const isComplete = current >= target;

                    return (
                        <div key={index}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">{condition.description}</span>
                                <span className={`font-mono ${isComplete ? 'text-green-400' : 'text-amber-400'}`}>
                                    {current}/{target} {isComplete && '✓'}
                                </span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${isComplete
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Completion Status */}
            {questProgress.isComplete && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-center">
                    <span className="text-green-400 font-bold">🎉 Quest Complete! You Win! 🎉</span>
                </div>
            )}
        </div>
    );
};
