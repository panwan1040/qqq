import { BuffType } from './Buff';
import { QuestCondition } from './Quest';

export enum CardType {
    CHARACTER = 'character',
    QUEST = 'quest',
    ATTACK = 'attack',
    HEAL = 'heal',
    ARMOR = 'armor',
    BUFF = 'buff',
    SPELL = 'spell',
    TRAP = 'trap',
    RARE = 'rare'
}

export enum TargetType {
    SELF = 'self',
    ENEMY = 'enemy',
    ALL_ENEMIES = 'all_enemies',
    ALL = 'all',
    NONE = 'none'
}

export interface BaseCard {
    id: string;
    name: string;
    description: string;
    type: CardType;
}

export interface PassiveTrigger {
    condition: string; // Event type that triggers it e.g. 'on_attack'
    value?: number;
}

export interface PassiveAbility {
    name: string;
    description: string;
    effectType: string;
    value: number;
}

export interface CharacterCard extends BaseCard {
    type: CardType.CHARACTER;
    passiveAbility: PassiveAbility;
    passiveTrigger: PassiveTrigger;
}

export interface QuestCard extends BaseCard {
    type: CardType.QUEST;
    conditions: QuestCondition[];
    targetValues: number[];
}

export interface CardEffect {
    type: string;
    value: number;
    buffType?: BuffType;
    duration?: number;
}

export interface ActionCard extends BaseCard {
    type: CardType.ATTACK | CardType.HEAL | CardType.ARMOR | CardType.BUFF;
    value: number;
    effect: CardEffect;
    targetType: TargetType;
}

export interface SpellCard extends BaseCard {
    type: CardType.SPELL;
    effect: CardEffect;
    targetType: TargetType;
}

export enum TrapTrigger {
    ON_ATTACK = 'on_attack',
    ON_SPELL = 'on_spell',
    ON_DRAW = 'on_draw',
    ON_HEAL = 'on_heal'
}

export interface TrapCard extends BaseCard {
    type: CardType.TRAP;
    trigger: TrapTrigger;
    effect: CardEffect;
}

export interface RareCard extends BaseCard {
    type: CardType.RARE;
    effect: CardEffect;
    isChaos: boolean;
}

export type Card = CharacterCard | QuestCard | ActionCard | SpellCard | TrapCard | RareCard;
