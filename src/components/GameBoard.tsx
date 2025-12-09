import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { PlayerStatus } from './PlayerStatus';
import { PlayerHand } from './PlayerHand';
import { QuestTracker } from './QuestTracker';
import { ActionLog } from './ActionLog';
import { DiceRoller } from './DiceRoller';
import { CardType, TargetType } from '../models/Card';

export const GameBoard: React.FC = () => {
    const gameState = useGameStore(state => state.gameState);
    const selectedCardId = useGameStore(state => state.selectedCardId);
    const selectedTargetId = useGameStore(state => state.selectedTargetId);
    const lastDiceRoll = useGameStore(state => state.lastDiceRoll);
    const lastDiceOutcome = useGameStore(state => state.lastDiceOutcome);
    const showDiceAnimation = useGameStore(state => state.showDiceAnimation);

    const selectTarget = useGameStore(state => state.selectTarget);
    const playSelectedCard = useGameStore(state => state.playSelectedCard);
    const drawCard = useGameStore(state => state.drawCard);
    const endTurn = useGameStore(state => state.endTurn);
    const saveGame = useGameStore(state => state.saveGame);
    const gameManager = useGameStore(state => state.gameManager);

    if (!gameState) return null;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const selectedCard = currentPlayer?.hand.find(c => c.id === selectedCardId);

    const needsTarget = selectedCard && (
        selectedCard.type === CardType.ATTACK ||
        (selectedCard.type === CardType.SPELL && 'targetType' in selectedCard && selectedCard.targetType === TargetType.ENEMY)
    );

    const handleTargetSelect = (playerId: string) => {
        if (!needsTarget) return;
        if (playerId === currentPlayer?.id) return;
        selectTarget(playerId);
        setTimeout(() => playSelectedCard(), 100);
    };

    const needsDiscard = currentPlayer && gameManager.needsDiscard(currentPlayer.id);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 p-4">
            <div className="max-w-7xl mx-auto mb-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Hidden Quest</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400">Turn {gameState.turnNumber}</span>
                        <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-300 text-sm">{gameState.turnPhase}</span>
                        <button onClick={saveGame} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm">💾 Save</button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1 space-y-3">
                    <h2 className="text-lg font-semibold text-white mb-2">Players</h2>
                    {gameState.players.map((player) => (
                        <PlayerStatus key={player.id} player={player} isCurrentPlayer={player.id === currentPlayer?.id}
                            isTargetable={needsTarget && player.id !== currentPlayer?.id && player.isAlive}
                            isSelected={selectedTargetId === player.id} onSelect={() => handleTargetSelect(player.id)} />
                    ))}
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {(lastDiceRoll || showDiceAnimation) && (
                        <div className="flex justify-center py-4">
                            <DiceRoller value={lastDiceRoll} outcome={lastDiceOutcome} isRolling={showDiceAnimation} />
                        </div>
                    )}

                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">{currentPlayer?.name}'s Turn</h2>
                            <div className="flex gap-2">
                                {gameState.turnPhase === 'draw' && (
                                    <button onClick={drawCard} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium">🃏 Draw Card</button>
                                )}
                                {!needsDiscard && (
                                    <button onClick={endTurn} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium">End Turn →</button>
                                )}
                            </div>
                        </div>
                        <div className="text-center py-2 text-slate-400">
                            {gameState.turnPhase === 'draw' && 'Draw a card to begin your turn'}
                            {gameState.turnPhase === 'action' && !selectedCardId && 'Select a card from your hand to play'}
                            {gameState.turnPhase === 'action' && selectedCardId && needsTarget && 'Select an opponent to target'}
                            {needsDiscard && '⚠️ Hand limit exceeded! Discard cards'}
                        </div>
                    </div>
                    <PlayerHand />
                    <div className="flex justify-center gap-6 text-sm text-slate-400">
                        <span>🎴 Draw: {gameState.drawDeck.length}</span>
                        <span>🗑️ Discard: {gameState.discardPile.length}</span>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <QuestTracker />
                    <ActionLog />
                </div>
            </div>
        </div>
    );
};
