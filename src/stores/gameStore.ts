import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, TurnPhase, ActionType } from '../models/GameState';
import { Player } from '../models/Player';
import { Card, QuestCard } from '../models/Card';
import { GameManager } from '../game/GameManager';

interface PendingQuestSelection {
    playerId: string;
    options: QuestCard[];
}

interface GameStore {
    // State
    gameState: GameState | null;
    gamePhase: 'setup' | 'quest_selection' | 'playing' | 'game_over';
    pendingQuestSelections: PendingQuestSelection[];
    currentQuestSelectionIndex: number;
    selectedTargetId: string | null;
    selectedCardId: string | null;
    lastDiceRoll: number | null;
    lastDiceOutcome: 'miss' | 'hit' | 'critical' | null;
    showDiceAnimation: boolean;
    errorMessage: string | null;

    // Game manager instance (not persisted)
    gameManager: GameManager;

    // Actions
    initGame: (playerNames: string[]) => void;
    selectQuest: (quest: QuestCard) => void;
    startPlaying: () => void;
    drawCard: () => void;
    selectCard: (cardId: string | null) => void;
    selectTarget: (targetId: string | null) => void;
    playSelectedCard: () => void;
    discardCard: (cardId: string) => void;
    endTurn: () => void;
    saveGame: () => void;
    loadGame: () => boolean;
    resetGame: () => void;
    clearError: () => void;
    setDiceAnimation: (show: boolean) => void;
}

const createInitialState = () => ({
    gameState: null,
    gamePhase: 'setup' as const,
    pendingQuestSelections: [],
    currentQuestSelectionIndex: 0,
    selectedTargetId: null,
    selectedCardId: null,
    lastDiceRoll: null,
    lastDiceOutcome: null,
    showDiceAnimation: false,
    errorMessage: null,
});

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            ...createInitialState(),
            gameManager: new GameManager(),

            initGame: (playerNames: string[]) => {
                const { gameManager } = get();
                try {
                    const gameState = gameManager.initializeGame(playerNames);

                    // Prepare quest selections for all players
                    const pendingQuestSelections: PendingQuestSelection[] = gameState.players.map(player => ({
                        playerId: player.id,
                        options: gameManager.getQuestOptions(player.id)
                    }));

                    set({
                        gameState,
                        gamePhase: 'quest_selection',
                        pendingQuestSelections,
                        currentQuestSelectionIndex: 0,
                        errorMessage: null
                    });
                } catch (error: any) {
                    set({ errorMessage: error.message });
                }
            },

            selectQuest: (quest: QuestCard) => {
                const { gameManager, pendingQuestSelections, currentQuestSelectionIndex } = get();

                const current = pendingQuestSelections[currentQuestSelectionIndex];
                if (!current) return;

                gameManager.selectPlayerQuest(current.playerId, quest);

                const nextIndex = currentQuestSelectionIndex + 1;

                if (nextIndex >= pendingQuestSelections.length) {
                    // All quests selected, start playing
                    set({
                        currentQuestSelectionIndex: nextIndex,
                        gameState: gameManager.getGameState(),
                        gamePhase: 'playing'
                    });
                } else {
                    set({
                        currentQuestSelectionIndex: nextIndex,
                        gameState: gameManager.getGameState()
                    });
                }
            },

            startPlaying: () => {
                set({ gamePhase: 'playing' });
            },

            drawCard: () => {
                const { gameManager, gameState } = get();
                if (!gameState) return;

                const currentPlayer = gameManager.getCurrentPlayer();
                if (!currentPlayer) return;

                gameManager.drawCard(currentPlayer.id);
                const newState = gameManager.getGameState();
                // After drawing, move to action phase
                newState.turnPhase = 'action' as any;
                set({
                    gameState: { ...newState },
                    errorMessage: null
                });
            },

            selectCard: (cardId: string | null) => {
                set({ selectedCardId: cardId });
            },

            selectTarget: (targetId: string | null) => {
                set({ selectedTargetId: targetId });
            },

            playSelectedCard: () => {
                const { gameManager, gameState, selectedCardId, selectedTargetId } = get();
                if (!gameState || !selectedCardId) return;

                const currentPlayer = gameManager.getCurrentPlayer();
                if (!currentPlayer) return;

                const card = currentPlayer.hand.find(c => c.id === selectedCardId);
                if (!card) return;

                // Show dice animation for attack cards
                if (card.type === 'attack') {
                    set({ showDiceAnimation: true });
                }

                const result = gameManager.playCard(currentPlayer.id, selectedCardId, selectedTargetId);

                const newState = gameManager.getGameState();

                // Get dice roll from action log if it was an attack
                const lastAction = newState.actionLog[newState.actionLog.length - 1];
                const diceRoll = lastAction?.diceRoll;
                let diceOutcome: 'miss' | 'hit' | 'critical' | null = null;
                if (diceRoll) {
                    if (diceRoll <= 2) diceOutcome = 'miss';
                    else if (diceRoll === 8) diceOutcome = 'critical';
                    else diceOutcome = 'hit';
                }

                set({
                    gameState: newState,
                    selectedCardId: null,
                    selectedTargetId: null,
                    lastDiceRoll: diceRoll || null,
                    lastDiceOutcome: diceOutcome,
                    showDiceAnimation: false,
                    errorMessage: result.success ? null : result.message,
                    gamePhase: newState.isGameOver ? 'game_over' : 'playing'
                });
            },

            discardCard: (cardId: string) => {
                const { gameManager, gameState } = get();
                if (!gameState) return;

                const currentPlayer = gameManager.getCurrentPlayer();
                if (!currentPlayer) return;

                gameManager.discardFromHand(currentPlayer.id, cardId);
                set({
                    gameState: { ...gameManager.getGameState() },
                    errorMessage: null
                });
            },

            endTurn: () => {
                const { gameManager } = get();
                gameManager.endTurn();

                const newState = gameManager.getGameState();
                set({
                    gameState: newState,
                    selectedCardId: null,
                    selectedTargetId: null,
                    lastDiceRoll: null,
                    lastDiceOutcome: null,
                    gamePhase: newState.isGameOver ? 'game_over' : 'playing'
                });
            },

            saveGame: () => {
                const { gameManager } = get();
                gameManager.saveGame();
            },

            loadGame: () => {
                const { gameManager } = get();
                const state = gameManager.loadGame();
                if (state) {
                    set({
                        gameState: state,
                        gamePhase: state.isGameOver ? 'game_over' : 'playing'
                    });
                    return true;
                }
                return false;
            },

            resetGame: () => {
                set({
                    ...createInitialState(),
                    gameManager: new GameManager()
                });
            },

            clearError: () => {
                set({ errorMessage: null });
            },

            setDiceAnimation: (show: boolean) => {
                set({ showDiceAnimation: show });
            }
        }),
        {
            name: 'hidden-quest-storage',
            partialize: (state) => ({
                // Only persist the game state, not the manager
                gameState: state.gameState,
                gamePhase: state.gamePhase
            })
        }
    )
);
