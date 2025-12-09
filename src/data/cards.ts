import { Card, CardType, TargetType, TrapTrigger } from '../models/Card';
import { BuffType } from '../models/Buff';

// Helper to create cards with unique IDs
const createCards = (
    baseId: string,
    count: number,
    template: Omit<Card, 'id'>
): Card[] => {
    return Array.from({ length: count }, (_, i) => ({
        ...template,
        id: `${baseId}_${i + 1}`
    } as Card));
};

const ATTACK_CARDS: Card[] = [
    ...createCards('atk_strike', 8, {
        name: 'Strike',
        description: 'Deal 4 damage.',
        type: CardType.ATTACK,
        value: 4,
        effect: { type: 'damage', value: 4 },
        targetType: TargetType.ENEMY
    }),
    ...createCards('atk_heavy', 4, {
        name: 'Heavy Swing',
        description: 'Deal 7 damage.',
        type: CardType.ATTACK,
        value: 7,
        effect: { type: 'damage', value: 7 },
        targetType: TargetType.ENEMY
    })
]; // 12

const HEAL_CARDS: Card[] = [
    ...createCards('heal_potion', 4, {
        name: 'Health Potion',
        description: 'Heal 5 HP.',
        type: CardType.HEAL,
        value: 5,
        effect: { type: 'heal', value: 5 },
        targetType: TargetType.SELF
    }),
    ...createCards('heal_great', 4, {
        name: 'Greater Potion',
        description: 'Heal 10 HP.',
        type: CardType.HEAL,
        value: 10,
        effect: { type: 'heal', value: 10 },
        targetType: TargetType.SELF
    })
]; // 8

const ARMOR_CARDS: Card[] = [
    ...createCards('armor_buckler', 3, {
        name: 'Buckler',
        description: 'Gain 3 Armor.',
        type: CardType.ARMOR,
        value: 3,
        effect: { type: 'armor', value: 3 },
        targetType: TargetType.SELF
    }),
    ...createCards('armor_plate', 2, {
        name: 'Plate Mail',
        description: 'Gain 6 Armor.',
        type: CardType.ARMOR,
        value: 6,
        effect: { type: 'armor', value: 6 },
        targetType: TargetType.SELF
    })
]; // 5

const BUFF_CARDS: Card[] = [
    ...createCards('buff_sharpen', 3, {
        name: 'Sharpen',
        description: 'Start turn with +2 ATK.',
        type: CardType.BUFF,
        value: 2,
        effect: { type: 'buff', buffType: BuffType.ATK_BOOST, value: 2, duration: 3 },
        targetType: TargetType.SELF
    }),
    ...createCards('buff_stone', 3, {
        name: 'Stone Skin',
        description: 'Gain +2 Armor every turn start.',
        type: CardType.BUFF,
        value: 2,
        effect: { type: 'buff', buffType: BuffType.ARMOR_BOOST, value: 2, duration: 3 },
        targetType: TargetType.SELF
    })
]; // 6

const SPELL_CARDS: Card[] = [
    ...createCards('spell_fireball', 3, {
        name: 'Fireball',
        description: 'Deal 8 damage (ignores armor).',
        type: CardType.SPELL,
        effect: { type: 'spell_damage', value: 8 },
        targetType: TargetType.ENEMY
    }),
    ...createCards('spell_zap', 3, {
        name: 'Lightning Zap',
        description: 'Verify if a player has a Trap and destroy it.',
        type: CardType.SPELL,
        effect: { type: 'destroy_trap', value: 0 },
        targetType: TargetType.ENEMY
    }),
    ...createCards('spell_greed', 3, {
        name: 'Pot of Greed',
        description: 'Draw 2 cards.',
        type: CardType.SPELL,
        effect: { type: 'draw', value: 2 },
        targetType: TargetType.SELF
    })
]; // 9

const TRAP_CARDS: Card[] = [
    ...createCards('trap_counter', 3, {
        name: 'Counter Attack',
        description: 'When attacked, deal 4 damage back.',
        type: CardType.TRAP,
        trigger: TrapTrigger.ON_ATTACK,
        effect: { type: 'reflect_damage', value: 4 }
    }),
    ...createCards('trap_mirror', 3, {
        name: 'Mirror Force',
        description: 'Reflect all damage back to attacker.',
        type: CardType.TRAP,
        trigger: TrapTrigger.ON_ATTACK,
        effect: { type: 'reflect_all', value: 0 }
    }),
    ...createCards('trap_thief', 3, {
        name: 'Mana Thief',
        description: 'When opponent plays Spell, steal it.',
        type: CardType.TRAP,
        trigger: TrapTrigger.ON_SPELL,
        effect: { type: 'steal_spell', value: 0 }
    })
]; // 9

const RARE_CARDS: Card[] = [
    ...createCards('rare_chaos', 2, {
        name: 'Chaos Warp',
        description: 'Shuffle everyone\'s quests and deal new ones.',
        type: CardType.RARE,
        isChaos: true,
        effect: { type: 'shuffle_quests', value: 0 }
    }),
    ...createCards('rare_doom', 1, {
        name: 'Doomsday',
        description: 'Deal 10 damage to ALL players (including self).',
        type: CardType.RARE,
        isChaos: true,
        effect: { type: 'damage_all', value: 10 }
    }),
    ...createCards('rare_miracle', 2, {
        name: 'Miracle',
        description: 'Fully restore HP.',
        type: CardType.RARE,
        isChaos: false,
        effect: { type: 'heal_full', value: 100 }
    })
]; // 5

export const ALL_CARDS: Card[] = [
    ...ATTACK_CARDS,
    ...HEAL_CARDS,
    ...ARMOR_CARDS,
    ...BUFF_CARDS,
    ...SPELL_CARDS,
    ...TRAP_CARDS,
    ...RARE_CARDS
];

// 12 + 8 + 5 + 6 + 9 + 9 + 5 = 54 cards.
