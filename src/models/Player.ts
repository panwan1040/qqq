import { CharacterCard, Card, QuestCard } from './Card';
import { QuestProgress } from './Quest';
import { Buff } from './Buff';

export interface Player {
    id: string;
    name: string;
    character: CharacterCard | null; // Nullable during setup? Requirement 1.1 says "randomly assign... to each player". Before that, maybe null? Or we enforce non-null. Let's say null allowed for 'empty' state or partial initialization.
    hp: number;
    maxHp: number;
    atk: number;
    armor: number;
    hand: Card[];
    quest: QuestCard | null;
    questProgress: QuestProgress | null;
    buffs: Buff[];
    isAlive: boolean;
    isEliminated: boolean;
}
