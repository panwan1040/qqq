import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { CardDisplay } from './CardDisplay';
import { Card, CardType, TargetType } from '../models/Card';

export const PlayerHand: React.FC = () => {
    const gameState = useGameStore(state => state.gameState);
    const selectedCardId = useGameStore(state => state.selectedCardId);
    const selectCard = useGameStore(state => state.selectCard);
    const playSelectedCard = useGameStore(state => state.playSelectedCard);
    const discardCard = useGameStore(state => state.discardCard);
    const gameManager = useGameStore(state => state.gameManager);

    if (!gameState) return null;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return null;

    // Check if we can play - either in action phase or after drawing
    const isActionPhase = gameState.turnPhase === 'action';
    const canPlayCard = isActionPhase && gameManager.canPlayCard();
    const needsDiscard = gameManager.needsDiscard(currentPlayer.id);
    const discardCount = gameManager.getDiscardCount(currentPlayer.id);

    const handleCardClick = (card: Card) => {
        if (needsDiscard) {
            discardCard(card.id);
        } else if (selectedCardId === card.id) {
            selectCard(null);
        } else {
            selectCard(card.id);
        }
    };

    const selectedCard = currentPlayer.hand.find(c => c.id === selectedCardId);
    const needsTarget = selectedCard && (
        selectedCard.type === CardType.ATTACK ||
        (selectedCard.type === CardType.SPELL && 'targetType' in selectedCard && selectedCard.targetType === TargetType.ENEMY)
    );

    return (
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Your Hand</h3>
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">
                        {currentPlayer.hand.length} / 4 cards
                    </span>
                    {needsDiscard && (
                        <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-red-300 text-xs">
                            Discard {discardCount}
                        </span>
                    )}
                </div>
            </div>

            {/* Cards */}
            <div className="flex gap-3 overflow-x-auto pb-2 justify-center flex-wrap">
                {currentPlayer.hand.map((card) => (
                    <CardDisplay
                        key={card.id}
                        card={card}
                        isSelected={selectedCardId === card.id}
                        isPlayable={canPlayCard || needsDiscard}
                        onClick={() => handleCardClick(card)}
                        size="medium"
                    />
                ))}
                {currentPlayer.hand.length === 0 && (
                    <div className="text-slate-500 py-8">No cards in hand</div>
                )}
            </div>

            {/* Selected Card Actions */}
            {selectedCard && !needsDiscard && (
                <div className="mt-4 flex items-center justify-center gap-4">
                    <div className="text-slate-300">
                        Selected: <span className="text-purple-400 font-medium">{selectedCard.name}</span>
                    </div>
                    {needsTarget ? (
                        <span className="text-amber-400 text-sm">↑ Select a target above ↑</span>
                    ) : (
                        <button
                            onClick={playSelectedCard}
                            disabled={!canPlayCard}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Play Card
                        </button>
                    )}
                </div>
            )}

            {/* Discard Mode */}
            {needsDiscard && (
                <div className="mt-4 text-center">
                    <p className="text-amber-400">Click cards to discard. Must discard {discardCount} card(s).</p>
                </div>
            )}
        </div>
    );
};
