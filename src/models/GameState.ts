import { Player } from './Player';
import { Card, TrapCard } from './Card';

export enum TurnPhase {
    DRAW = 'draw',
    ACTION = 'action',
    DICE_ROLL = 'dice_roll',
    QUEST_CHECK = 'quest_check',
    DISCARD = 'discard',
    END = 'end'
}

export enum ActionType {
    DRAW = 'draw',
    PLAY_CARD = 'play_card',
    ATTACK = 'attack',
    HEAL = 'heal',
    BUFF = 'buff',
    SPELL = 'spell',
    TRAP_SET = 'trap_set',
    TRAP_TRIGGER = 'trap_trigger',
    DISCARD = 'discard',
    QUEST_COMPLETE = 'quest_complete',
    DEATH = 'death',
    REVIVE = 'revive'
}

export interface ActionResult {
    success: boolean;
    message: string;
    damageDealt?: number;
    healedAmount?: number;
}

export interface GameAction {
    playerId: string;
    actionType: ActionType;
    cardId: string | null;
    targetId: string | null;
    diceRoll: number | null;
    result: ActionResult;
    timestamp: number;
}

export interface GameState {
    id: string;
    players: Player[];
    currentPlayerIndex: number;
    turnNumber: number;
    turnPhase: TurnPhase;
    drawDeck: Card[];
    discardPile: Card[];
    activeTrap: TrapCard | null;
    winner: Player | null;
    isGameOver: boolean;
    turnOrder: string[]; // Player IDs
    actionLog: GameAction[];
}
