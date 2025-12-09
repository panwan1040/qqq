import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { QuestCard } from '../models/Card';

export const QuestSelectionScreen: React.FC = () => {
    const pendingQuestSelections = useGameStore(state => state.pendingQuestSelections);
    const currentQuestSelectionIndex = useGameStore(state => state.currentQuestSelectionIndex);
    const gameState = useGameStore(state => state.gameState);
    const selectQuest = useGameStore(state => state.selectQuest);

    if (!gameState) return null;

    const currentSelection = pendingQuestSelections[currentQuestSelectionIndex];
    if (!currentSelection) return null;

    const currentPlayer = gameState.players.find(p => p.id === currentSelection.playerId);
    if (!currentPlayer) return null;

    const handleSelectQuest = (quest: QuestCard) => {
        selectQuest(quest);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Progress */}
                <div className="text-center mb-6">
                    <p className="text-slate-400 text-sm mb-2">
                        Quest Selection {currentQuestSelectionIndex + 1} of {pendingQuestSelections.length}
                    </p>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${((currentQuestSelectionIndex) / pendingQuestSelections.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Player Info */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {currentPlayer.name}'s Turn
                    </h1>
                    <p className="text-slate-400">Choose your secret quest</p>
                    {currentPlayer.character && (
                        <div className="mt-4 inline-block px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                            <span className="text-purple-400 font-medium">{currentPlayer.character.name}</span>
                            <span className="text-slate-500 mx-2">•</span>
                            <span className="text-slate-400 text-sm">{currentPlayer.character.passiveAbility.name}</span>
                        </div>
                    )}
                </div>

                {/* Quest Options */}
                <div className="grid gap-4 md:grid-cols-2">
                    {currentSelection.options.map((quest, index) => (
                        <button
                            key={quest.id}
                            onClick={() => handleSelectQuest(quest)}
                            className="group relative bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 text-left"
                        >
                            {/* Quest Number Badge */}
                            <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                {index + 1}
                            </div>

                            {/* Quest Content */}
                            <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors">
                                {quest.name}
                            </h3>
                            <p className="text-slate-400 mb-4 leading-relaxed">
                                {quest.description}
                            </p>

                            {/* Conditions */}
                            <div className="space-y-2">
                                {quest.conditions.map((condition, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                        <span className="text-slate-300">{condition.description}</span>
                                        <span className="text-purple-400 font-mono ml-auto">
                                            0/{quest.targetValues[i]}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 rounded-2xl transition-all duration-300" />
                        </button>
                    ))}
                </div>

                {/* Hint */}
                <p className="text-center text-slate-500 text-sm mt-8">
                    🔒 Your quest is secret. Complete it to win!
                </p>
            </div>
        </div>
    );
};
