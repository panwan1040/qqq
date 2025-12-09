import { Card } from '../models/Card';
import { ALL_CARDS } from '../data/cards';
import { shuffle } from '../utils/shuffle';

export class CardDeck {
    private drawPile: Card[] = [];
    private discardPile: Card[] = [];

    initialize(): void {
        // Clone the cards to prevent mutation issues
        this.drawPile = shuffle(ALL_CARDS.map(card => ({ ...card })));
        this.discardPile = [];
    }

    shuffle(): void {
        this.drawPile = shuffle(this.drawPile);
    }

    draw(count: number = 1): Card[] {
        const drawn: Card[] = [];
        for (let i = 0; i < count; i++) {
            if (this.drawPile.length === 0) {
                this.reshuffleDiscardPile();
            }
            if (this.drawPile.length > 0) {
                drawn.push(this.drawPile.pop()!);
            }
        }
        return drawn;
    }

    discard(card: Card): void {
        this.discardPile.push(card);
    }

    discardMultiple(cards: Card[]): void {
        this.discardPile.push(...cards);
    }

    getRemainingCount(): number {
        return this.drawPile.length;
    }

    getDiscardCount(): number {
        return this.discardPile.length;
    }

    reshuffleDiscardPile(): void {
        if (this.discardPile.length > 0) {
            this.drawPile = shuffle([...this.discardPile]);
            this.discardPile = [];
        }
    }

    getDrawPile(): Card[] {
        return [...this.drawPile];
    }

    getDiscardPile(): Card[] {
        return [...this.discardPile];
    }

    setDrawPile(cards: Card[]): void {
        this.drawPile = [...cards];
    }

    setDiscardPile(cards: Card[]): void {
        this.discardPile = [...cards];
    }
}
