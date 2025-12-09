import { Player } from '../models/Player';
import { TurnPhase } from '../models/GameState';

export const HAND_LIMIT = 4;

export class TurnManager {
    private currentPlayerIndex: number = 0;
    private turnPhase: TurnPhase = TurnPhase.DRAW;
    private cardPlayedThisTurn: boolean = false;
    private turnOrder: string[] = [];

    initialize(playerIds: string[], firstPlayerIndex: number): void {
        this.turnOrder = [...playerIds];
        this.currentPlayerIndex = firstPlayerIndex;
        this.turnPhase = TurnPhase.DRAW;
        this.cardPlayedThisTurn = false;
    }

    startTurn(): void {
        this.turnPhase = TurnPhase.DRAW;
        this.cardPlayedThisTurn = false;
    }

    endTurn(players: Player[]): void {
        this.turnPhase = TurnPhase.END;
        // Find next alive player
        let nextIndex = (this.currentPlayerIndex + 1) % this.turnOrder.length;
        let attempts = 0;

        while (attempts < this.turnOrder.length) {
            const nextPlayerId = this.turnOrder[nextIndex];
            const nextPlayer = players.find(p => p.id === nextPlayerId);
            if (nextPlayer && nextPlayer.isAlive) {
                this.currentPlayerIndex = nextIndex;
                break;
            }
            nextIndex = (nextIndex + 1) % this.turnOrder.length;
            attempts++;
        }

        this.startTurn();
    }

    getCurrentPlayerId(): string {
        return this.turnOrder[this.currentPlayerIndex];
    }

    getNextPlayerId(players: Player[]): string | null {
        let nextIndex = (this.currentPlayerIndex + 1) % this.turnOrder.length;
        let attempts = 0;

        while (attempts < this.turnOrder.length) {
            const nextPlayerId = this.turnOrder[nextIndex];
            const nextPlayer = players.find(p => p.id === nextPlayerId);
            if (nextPlayer && nextPlayer.isAlive) {
                return nextPlayerId;
            }
            nextIndex = (nextIndex + 1) % this.turnOrder.length;
            attempts++;
        }
        return null;
    }

    getTurnPhase(): TurnPhase {
        return this.turnPhase;
    }

    advancePhase(): void {
        const phases = [
            TurnPhase.DRAW,
            TurnPhase.ACTION,
            TurnPhase.DICE_ROLL,
            TurnPhase.QUEST_CHECK,
            TurnPhase.DISCARD,
            TurnPhase.END
        ];
        const currentIndex = phases.indexOf(this.turnPhase);
        if (currentIndex < phases.length - 1) {
            this.turnPhase = phases[currentIndex + 1];
        }
    }

    setPhase(phase: TurnPhase): void {
        this.turnPhase = phase;
    }

    canPlayCard(): boolean {
        return !this.cardPlayedThisTurn && this.turnPhase === TurnPhase.ACTION;
    }

    markCardPlayed(): void {
        this.cardPlayedThisTurn = true;
    }

    hasPlayedCard(): boolean {
        return this.cardPlayedThisTurn;
    }

    needsDiscard(handSize: number): boolean {
        return handSize > HAND_LIMIT;
    }

    getDiscardCount(handSize: number): number {
        return Math.max(0, handSize - HAND_LIMIT);
    }

    getTurnOrder(): string[] {
        return [...this.turnOrder];
    }

    getCurrentPlayerIndex(): number {
        return this.currentPlayerIndex;
    }

    setCurrentPlayerIndex(index: number): void {
        this.currentPlayerIndex = index;
    }

    setTurnOrder(order: string[]): void {
        this.turnOrder = [...order];
    }
}
