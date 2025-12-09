import { Player } from '../models/Player';
import { GameState, TurnPhase, ActionType, GameAction, ActionResult } from '../models/GameState';
import { Card, CharacterCard, QuestCard, ActionCard, CardType, TrapCard } from '../models/Card';
import { CardDeck } from './CardDeck';
import { TurnManager, HAND_LIMIT } from './TurnManager';
import { CombatManager } from './CombatManager';
import { QuestManager } from './QuestManager';
import { CardEffectResolver } from './CardEffectResolver';
import { CHARACTERS } from '../data/characters';
import { shuffle } from '../utils/shuffle';
import { rollD8 } from '../utils/dice';
import { serializeGameState, deserializeGameState } from '../utils/serializer';

const STORAGE_KEY = 'hidden_quest_save';

export class GameManager {
    private cardDeck: CardDeck;
    private turnManager: TurnManager;
    private combatManager: CombatManager;
    private questManager: QuestManager;
    private cardEffectResolver: CardEffectResolver;
    private gameState: GameState;

    constructor() {
        this.cardDeck = new CardDeck();
        this.turnManager = new TurnManager();
        this.combatManager = new CombatManager();
        this.questManager = new QuestManager();
        this.cardEffectResolver = new CardEffectResolver(this.combatManager, this.questManager);
        this.gameState = this.createEmptyGameState();
    }

    private createEmptyGameState(): GameState {
        return {
            id: '',
            players: [],
            currentPlayerIndex: 0,
            turnNumber: 1,
            turnPhase: TurnPhase.DRAW,
            drawDeck: [],
            discardPile: [],
            activeTrap: null,
            winner: null,
            isGameOver: false,
            turnOrder: [],
            actionLog: []
        };
    }

    initializeGame(playerNames: string[]): GameState {
        const playerCount = playerNames.length;
        if (playerCount < 4 || playerCount > 6) {
            throw new Error('Player count must be between 4 and 6');
        }

        // Initialize deck
        this.cardDeck.initialize();
        this.questManager.initialize();

        // Shuffle and assign characters
        const shuffledCharacters = shuffle([...CHARACTERS]).slice(0, playerCount);

        // Create players
        const players: Player[] = playerNames.map((name, index) => ({
            id: `player_${index}`,
            name,
            character: shuffledCharacters[index],
            hp: 40,
            maxHp: 40,
            atk: 4,
            armor: 0,
            hand: [],
            quest: null,
            questProgress: null,
            buffs: [],
            isAlive: true,
            isEliminated: false
        }));

        // Apply starting passives (like Paladin's starting armor)
        players.forEach(player => {
            if (player.character?.passiveAbility.effectType === 'start_armor') {
                player.armor = player.character.passiveAbility.value;
            }
        });

        // Determine turn order by D8 rolls
        const { turnOrder, firstPlayerIndex } = this.determineTurnOrder(players);

        // Deal initial 3 cards
        players.forEach(player => {
            player.hand = this.cardDeck.draw(3);
        });

        // Initialize turn manager
        this.turnManager.initialize(
            players.map(p => p.id),
            firstPlayerIndex
        );

        // Create game state
        this.gameState = {
            id: `game_${Date.now()}`,
            players,
            currentPlayerIndex: firstPlayerIndex,
            turnNumber: 1,
            turnPhase: TurnPhase.DRAW,
            drawDeck: this.cardDeck.getDrawPile(),
            discardPile: [],
            activeTrap: null,
            winner: null,
            isGameOver: false,
            turnOrder,
            actionLog: []
        };

        return this.gameState;
    }

    private determineTurnOrder(players: Player[]): { turnOrder: string[], firstPlayerIndex: number } {
        type RollResult = { playerId: string; roll: number };
        const rolls: RollResult[] = players.map(p => ({ playerId: p.id, roll: rollD8() }));

        // Find highest roll (with re-roll for ties)
        let maxRoll = Math.max(...rolls.map(r => r.roll));
        let candidates = rolls.filter(r => r.roll === maxRoll);

        while (candidates.length > 1) {
            candidates = candidates.map(c => ({ ...c, roll: rollD8() }));
            maxRoll = Math.max(...candidates.map(r => r.roll));
            candidates = candidates.filter(r => r.roll === maxRoll);
        }

        const firstPlayerId = candidates[0].playerId;
        const firstPlayerIndex = players.findIndex(p => p.id === firstPlayerId);

        // Create turn order starting from first player
        const turnOrder: string[] = [];
        for (let i = 0; i < players.length; i++) {
            const index = (firstPlayerIndex + i) % players.length;
            turnOrder.push(players[index].id);
        }

        return { turnOrder, firstPlayerIndex };
    }

    // Get pending quest options for a player
    getQuestOptions(playerId: string): QuestCard[] {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) return [];
        return this.questManager.assignQuests(player);
    }

    // Player selects their quest
    selectPlayerQuest(playerId: string, quest: QuestCard): void {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) return;
        this.questManager.selectQuest(player, quest);
    }

    // Draw phase
    drawCard(playerId: string): Card | null {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) return null;

        // Sync deck from state
        this.cardDeck.setDrawPile(this.gameState.drawDeck);
        this.cardDeck.setDiscardPile(this.gameState.discardPile);

        const drawn = this.cardDeck.draw(1);
        if (drawn.length > 0) {
            player.hand.push(drawn[0]);
            this.questManager.updateProgress(player, { type: 'draw_cards', value: 1 });

            // Update state
            this.gameState.drawDeck = this.cardDeck.getDrawPile();
            this.gameState.discardPile = this.cardDeck.getDiscardPile();

            this.logAction(playerId, ActionType.DRAW, drawn[0].id, null, null, {
                success: true,
                message: `Drew ${drawn[0].name}`
            });

            return drawn[0];
        }
        return null;
    }

    // Play a card
    playCard(
        playerId: string,
        cardId: string,
        targetId: string | null = null
    ): ActionResult {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) return { success: false, message: 'Player not found' };

        // Check if already played a card this turn
        if (this.turnManager.hasPlayedCard()) {
            return { success: false, message: 'Already played a card this turn' };
        }

        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
            return { success: false, message: 'Card not in hand' };
        }

        const card = player.hand[cardIndex];
        const target = targetId ? this.gameState.players.find(p => p.id === targetId) : null;

        // Handle attack cards - need dice roll
        if (card.type === CardType.ATTACK) {
            const diceResult = this.combatManager.rollD8();
            const result = this.cardEffectResolver.resolveEffect(card, player, target, diceResult.value);

            // Remove card from hand
            player.hand.splice(cardIndex, 1);
            this.discardCard(card);
            this.turnManager.markCardPlayed();

            // Check for character passive on attack
            if (player.character?.passiveTrigger.condition === 'on_attack') {
                this.combatManager.applyArmor(player, player.character.passiveAbility.value);
            }

            // Check if target died
            if (target && this.combatManager.checkDeath(target)) {
                this.questManager.updateProgress(player, { type: 'kill_player', value: 1 });
                this.checkWinConditions();
            }

            this.logAction(playerId, ActionType.ATTACK, cardId, targetId, diceResult.value, result);
            return result;
        }

        // Handle trap cards
        if (card.type === CardType.TRAP) {
            player.hand.splice(cardIndex, 1);
            this.gameState.activeTrap = card as TrapCard;
            this.turnManager.markCardPlayed();

            this.questManager.updateProgress(player, { type: 'play_trap', value: 1 });

            const result = { success: true, message: 'Trap set!' };
            this.logAction(playerId, ActionType.TRAP_SET, cardId, null, null, result);
            return result;
        }

        // Handle other cards
        const result = this.cardEffectResolver.resolveEffect(card, player, target);

        // Remove card from hand
        player.hand.splice(cardIndex, 1);
        this.discardCard(card);
        this.turnManager.markCardPlayed();

        // Track card type plays for quest
        this.questManager.updateProgress(player, { type: `play_${card.type}`, value: 1 });

        // Handle spell draw effect
        if (card.type === CardType.SPELL && result.cardsDrawn) {
            for (let i = 0; i < result.cardsDrawn; i++) {
                this.drawCard(playerId);
            }
        }

        // Handle rare chaos card quest shuffle
        if (card.type === CardType.RARE && (card as any).isChaos) {
            if ((card as any).effect.type === 'shuffle_quests') {
                // Reset all player quests
                this.gameState.players.forEach(p => {
                    if (p.isAlive) {
                        this.questManager.resetQuest(p);
                    }
                });
            }
        }

        const actionType = this.getActionTypeFromCard(card);
        this.logAction(playerId, actionType, cardId, targetId, null, result);

        return result;
    }

    private getActionTypeFromCard(card: Card): ActionType {
        switch (card.type) {
            case CardType.ATTACK: return ActionType.ATTACK;
            case CardType.HEAL: return ActionType.HEAL;
            case CardType.BUFF: return ActionType.BUFF;
            case CardType.SPELL: return ActionType.SPELL;
            default: return ActionType.PLAY_CARD;
        }
    }

    // Discard a card
    discardCard(card: Card): void {
        this.cardDeck.setDrawPile(this.gameState.drawDeck);
        this.cardDeck.setDiscardPile(this.gameState.discardPile);
        this.cardDeck.discard(card);
        this.gameState.discardPile = this.cardDeck.getDiscardPile();
    }

    // Discard from hand
    discardFromHand(playerId: string, cardId: string): boolean {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) return false;

        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return false;

        const card = player.hand.splice(cardIndex, 1)[0];
        this.discardCard(card);

        this.questManager.updateProgress(player, { type: 'discard_cards', value: 1 });

        // Check empty hand quest
        if (player.hand.length === 0) {
            this.questManager.updateProgress(player, { type: 'empty_hand', value: 1 });
        }

        this.logAction(playerId, ActionType.DISCARD, cardId, null, null, {
            success: true,
            message: `Discarded ${card.name}`
        });

        return true;
    }

    // End turn
    endTurn(): void {
        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer) return;

        // Decrement buff durations
        this.cardEffectResolver.decrementBuffDurations(currentPlayer);

        // Check hand limit
        if (currentPlayer.hand.length > HAND_LIMIT) {
            // Force discard handled by UI
            return;
        }

        // Update turn state
        this.gameState.turnNumber++;
        this.turnManager.endTurn(this.gameState.players);

        this.gameState.currentPlayerIndex = this.turnManager.getCurrentPlayerIndex();
        this.gameState.turnPhase = TurnPhase.DRAW;

        // Apply start-of-turn passives
        const nextPlayer = this.getCurrentPlayer();
        if (nextPlayer?.character?.passiveTrigger.condition === 'on_turn_start') {
            if (nextPlayer.character.passiveAbility.effectType === 'regen') {
                this.combatManager.applyHeal(nextPlayer, nextPlayer.character.passiveAbility.value);
            }
        }

        // Check win conditions
        this.checkWinConditions();
    }

    // Check win conditions
    private checkWinConditions(): void {
        // Check quest completion
        for (const player of this.gameState.players) {
            if (player.isAlive && player.questProgress?.isComplete) {
                this.endGame(player);
                return;
            }
        }

        // Check survival (last player standing)
        const alivePlayers = this.gameState.players.filter(p => p.isAlive);
        if (alivePlayers.length === 1) {
            this.endGame(alivePlayers[0]);
            return;
        }

        // Check if only 2 players remain for certain quests
        if (alivePlayers.length === 2) {
            for (const player of alivePlayers) {
                this.questManager.updateProgress(player, { type: 'players_remaining', value: 2 });
            }
        }
    }

    // End game
    endGame(winner: Player): void {
        this.gameState.winner = winner;
        this.gameState.isGameOver = true;
    }

    // Save game
    saveGame(): string {
        const json = serializeGameState(this.gameState);
        try {
            localStorage.setItem(STORAGE_KEY, json);
        } catch (e) {
            // LocalStorage may not be available
        }
        return json;
    }

    // Load game
    loadGame(data?: string): GameState | null {
        try {
            const json = data || localStorage.getItem(STORAGE_KEY);
            if (!json) return null;

            const state = deserializeGameState(json);
            this.gameState = state;

            // Restore managers
            this.cardDeck.setDrawPile(state.drawDeck);
            this.cardDeck.setDiscardPile(state.discardPile);
            this.turnManager.setTurnOrder(state.turnOrder);
            this.turnManager.setCurrentPlayerIndex(state.currentPlayerIndex);

            return state;
        } catch (e) {
            return null;
        }
    }

    // Getters
    getGameState(): GameState {
        return this.gameState;
    }

    getCurrentPlayer(): Player | null {
        return this.gameState.players[this.gameState.currentPlayerIndex] || null;
    }

    getPlayer(playerId: string): Player | undefined {
        return this.gameState.players.find(p => p.id === playerId);
    }

    needsDiscard(playerId: string): boolean {
        const player = this.gameState.players.find(p => p.id === playerId);
        return player ? player.hand.length > HAND_LIMIT : false;
    }

    getDiscardCount(playerId: string): number {
        const player = this.gameState.players.find(p => p.id === playerId);
        return player ? Math.max(0, player.hand.length - HAND_LIMIT) : 0;
    }

    canPlayCard(): boolean {
        return !this.turnManager.hasPlayedCard();
    }

    private logAction(
        playerId: string,
        actionType: ActionType,
        cardId: string | null,
        targetId: string | null,
        diceRoll: number | null,
        result: ActionResult
    ): void {
        this.gameState.actionLog.push({
            playerId,
            actionType,
            cardId,
            targetId,
            diceRoll,
            result,
            timestamp: Date.now()
        });
    }
}
