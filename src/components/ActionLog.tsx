import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { ActionType } from '../models/GameState';

const actionTypeLabels: Record<ActionType, string> = {
    [ActionType.DRAW]: '🃏 Drew card',
    [ActionType.PLAY_CARD]: '🎴 Played card',
    [ActionType.ATTACK]: '⚔️ Attacked',
    [ActionType.HEAL]: '💚 Healed',
    [ActionType.BUFF]: '✨ Applied buff',
    [ActionType.SPELL]: '🔮 Cast spell',
    [ActionType.TRAP_SET]: '⚡ Set trap',
    [ActionType.TRAP_TRIGGER]: '💥 Trap triggered',
    [ActionType.DISCARD]: '🗑️ Discarded',
    [ActionType.QUEST_COMPLETE]: '🏆 Quest complete',
    [ActionType.DEATH]: '💀 Eliminated',
    [ActionType.REVIVE]: '✨ Revived'
};

export const ActionLog: React.FC = () => {
    const gameState = useGameStore(state => state.gameState);

    if (!gameState) return null;

    const recentActions = gameState.actionLog.slice(-10).reverse();

    const getPlayerName = (playerId: string) => {
        return gameState.players.find(p => p.id === playerId)?.name || 'Unknown';
    };

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span>📋</span>
                <span>Action Log</span>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto">
                {recentActions.length === 0 ? (
                    <p className="text-slate-500 text-sm">No actions yet</p>
                ) : (
                    recentActions.map((action, index) => (
                        <div
                            key={`${action.timestamp}-${index}`}
                            className="flex items-start gap-2 text-sm p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors"
                        >
                            <span className="text-lg">
                                {actionTypeLabels[action.actionType]?.split(' ')[0] || '❓'}
                            </span>
                            <div className="flex-1">
                                <span className="text-purple-400 font-medium">
                                    {getPlayerName(action.playerId)}
                                </span>
                                <span className="text-slate-400">
                                    {' '}{action.result.message}
                                </span>
                                {action.diceRoll && (
                                    <span className="text-amber-400 ml-2">
                                        🎲 {action.diceRoll}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Turn Info */}
            <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between text-sm text-slate-400">
                <span>Turn {gameState.turnNumber}</span>
                <span>Phase: {gameState.turnPhase}</span>
            </div>
        </div>
    );
};
