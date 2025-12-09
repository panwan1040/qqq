import { CharacterCard, CardType } from '../models/Card';

export const CHARACTERS: CharacterCard[] = [
    {
        id: 'char_warrior',
        name: 'Warrior',
        description: 'A master of arms who gains defense while attacking.',
        type: CardType.CHARACTER,
        hp: 40, // Base stats are set in initialization, this is reference
        passiveAbility: {
            name: 'Shield Bash',
            description: 'Gain 1 Armor when you perform an Attack action.',
            effectType: 'gain_armor',
            value: 1
        },
        passiveTrigger: { condition: 'on_attack', value: 1 }
    },
    {
        id: 'char_mage',
        name: 'Mage',
        description: 'A spellcaster who amplifies magical effects.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Arcane Mastery',
            description: 'Deal +2 damage when using Spell cards.',
            effectType: 'spell_damage_boost',
            value: 2
        },
        passiveTrigger: { condition: 'on_spell_damage', value: 2 },
        hp: 40
    },
    {
        id: 'char_rogue',
        name: 'Rogue',
        description: 'A sneaky fighter who strikes critical points.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Precision',
            description: 'Critical hits deal 2.5x damage instead of 2x.',
            effectType: 'crit_damage_boost',
            value: 0.5
        },
        passiveTrigger: { condition: 'on_crit', value: 0.5 },
        hp: 40
    },
    {
        id: 'char_cleric',
        name: 'Cleric',
        description: 'A healer who restores more life.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Divine Light',
            description: 'Heal actions restore +2 extra HP.',
            effectType: 'heal_boost',
            value: 2
        },
        passiveTrigger: { condition: 'on_heal', value: 2 },
        hp: 40
    },
    {
        id: 'char_paladin',
        name: 'Paladin',
        description: 'A holy knight with strong defenses.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Holy Aura',
            description: 'Start the game with 2 Armor.',
            effectType: 'start_armor',
            value: 2
        },
        passiveTrigger: { condition: 'on_start', value: 2 },
        hp: 40
    },
    {
        id: 'char_warlock',
        name: 'Warlock',
        description: 'Uses forbidden arts to drain life.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Life Drain',
            description: 'When dealing damage, heal for 1 HP.',
            effectType: 'lifesteal',
            value: 1
        },
        passiveTrigger: { condition: 'on_damage_deal', value: 1 },
        hp: 40
    },
    {
        id: 'char_ranger',
        name: 'Ranger',
        description: 'Expert marksman who never misses easily.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Eagle Eye',
            description: 'Reroll attack dice once if result is 1.',
            effectType: 'reroll_miss_1',
            value: 1
        },
        passiveTrigger: { condition: 'on_attack_roll', value: 1 },
        hp: 40
    },
    {
        id: 'char_druid',
        name: 'Druid',
        description: 'One with nature, regenerating over time.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Nature\'s Grace',
            description: 'Heal 1 HP at the start of your turn.',
            effectType: 'regen',
            value: 1
        },
        passiveTrigger: { condition: 'on_turn_start', value: 1 },
        hp: 40
    },
    {
        id: 'char_bard',
        name: 'Bard',
        description: 'Inspires allies and confuses enemies.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Ballad',
            description: 'Draw 2 cards instead of 1 at start of turn, then discard 1.',
            effectType: 'draw_discard',
            value: 1
        },
        passiveTrigger: { condition: 'on_draw_phase', value: 1 },
        hp: 40
    },
    {
        id: 'char_barbarian',
        name: 'Barbarian',
        description: 'A brutal warrior who hits harder when low on health.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Berserk',
            description: 'Gain +2 Attack when HP is below 15.',
            effectType: 'low_hp_atk',
            value: 2
        },
        passiveTrigger: { condition: 'on_low_hp', value: 15 },
        hp: 40
    },
    {
        id: 'char_monk',
        name: 'Monk',
        description: 'Disciplined fighter who can dodge attacks.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Evasion',
            description: '10% chance to dodge any attack (take 0 damage).',
            effectType: 'dodge_chance',
            value: 10
        },
        passiveTrigger: { condition: 'on_defend', value: 10 },
        hp: 40
    },
    {
        id: 'char_necromancer',
        name: 'Necromancer',
        description: 'Manipulates death to gain advantage.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Soul Harvest',
            description: 'Gain 1 max HP whenever another player takes damage.',
            effectType: 'max_hp_gain',
            value: 1
        },
        passiveTrigger: { condition: 'on_other_damage', value: 1 },
        hp: 40
    },
    {
        id: 'char_alchemist',
        name: 'Alchemist',
        description: 'Enhances items and potions.',
        type: CardType.CHARACTER,
        passiveAbility: {
            name: 'Transmute',
            description: 'Discard 2 cards to draw 1 card (once per turn).',
            effectType: 'transmute',
            value: 1
        },
        passiveTrigger: { condition: 'active_ability', value: 1 },
        hp: 40
    }
];
