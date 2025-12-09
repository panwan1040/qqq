import { QuestCard, CardType } from '../models/Card';

export const QUESTS: QuestCard[] = [
    // DAMAGE FOCUSED
    {
        id: 'quest_01',
        name: 'Bloodthirsty',
        description: 'Deal a total of 50 damage to opponents.',
        type: CardType.QUEST,
        conditions: [{ type: 'deal_damage', description: 'Deal Damage' }],
        targetValues: [50]
    },
    {
        id: 'quest_02',
        name: 'Executioner',
        description: 'Deal the killing blow to a player.',
        type: CardType.QUEST,
        conditions: [{ type: 'kill_player', description: 'Kill Player' }],
        targetValues: [1]
    },
    {
        id: 'quest_03',
        name: 'Spellweaver',
        description: 'Deal 30 damage using Spell cards.',
        type: CardType.QUEST,
        conditions: [{ type: 'spell_damage', description: 'Spell Damage' }],
        targetValues: [30]
    },
    {
        id: 'quest_04',
        name: 'Critical Master',
        description: 'Land 3 Critical Hits.',
        type: CardType.QUEST,
        conditions: [{ type: 'critical_hit', description: 'Critical Hits' }],
        targetValues: [3]
    },

    // SURVIVAL FOCUSED
    {
        id: 'quest_05',
        name: 'Survivor',
        description: 'Survive until only 2 players remain (including you).',
        type: CardType.QUEST,
        conditions: [{ type: 'players_remaining', description: 'Players Left' }],
        targetValues: [2]
    },
    {
        id: 'quest_06',
        name: 'Ironclad',
        description: 'Accumulate 10 Armor at once.',
        type: CardType.QUEST,
        conditions: [{ type: 'have_armor', description: 'Current Armor' }],
        targetValues: [10]
    },
    {
        id: 'quest_07',
        name: 'Unkillable',
        description: 'Heal a total of 40 HP.',
        type: CardType.QUEST,
        conditions: [{ type: 'heal_hp', description: 'Total Healed' }],
        targetValues: [40]
    },
    {
        id: 'quest_08',
        name: 'Masochist',
        description: 'Take 40 damage and still be alive.',
        type: CardType.QUEST,
        conditions: [{ type: 'take_damage', description: 'Damage Taken' }],
        targetValues: [40]
    },

    // CARD USAGE
    {
        id: 'quest_09',
        name: 'Scholar',
        description: 'Draw 20 cards total.',
        type: CardType.QUEST,
        conditions: [{ type: 'draw_cards', description: 'Cards Drawn' }],
        targetValues: [20]
    },
    {
        id: 'quest_10',
        name: 'Trap Master',
        description: 'Trigger 3 Trap cards.',
        type: CardType.QUEST,
        conditions: [{ type: 'trigger_trap', description: 'Traps Triggered' }],
        targetValues: [3]
    },
    {
        id: 'quest_11',
        name: 'Buffer',
        description: 'Have 3 active Buffs on yourself simultaneous.',
        type: CardType.QUEST,
        conditions: [{ type: 'active_buffs', description: 'Active Buffs' }],
        targetValues: [3]
    },
    {
        id: 'quest_12',
        name: 'Pacifist',
        description: 'Win a turn without dealing damage (5 times).',
        type: CardType.QUEST,
        conditions: [{ type: 'peaceful_turns', description: 'Peaceful Turns' }],
        targetValues: [5]
    },

    // INTERACTION
    {
        id: 'quest_13',
        name: 'Nemesis',
        description: 'Deal 20 damage to a specific player (Player to your right).',
        type: CardType.QUEST,
        conditions: [{ type: 'damage_nemesis', description: 'Damage to Right' }],
        targetValues: [20]
    },
    {
        id: 'quest_14',
        name: 'Protector',
        description: 'Cast Armor or Heal checks on other players 5 times.',
        type: CardType.QUEST,
        conditions: [{ type: 'help_others', description: 'Others Helped' }],
        targetValues: [5]
    },
    {
        id: 'quest_15',
        name: 'Hoarder',
        description: 'Hold 4 cards of the same type in hand.',
        type: CardType.QUEST,
        conditions: [{ type: 'same_type_hand', description: 'Same Type Count' }],
        targetValues: [4]
    },
    {
        id: 'quest_16',
        name: 'Jack of All Trades',
        description: 'Play one of each card type: Attack, Heal, Armor, Buff, Spell, Trap.',
        type: CardType.QUEST,
        conditions: [
            { type: 'play_attack', description: 'Attack Played' },
            { type: 'play_heal', description: 'Heal Played' },
            { type: 'play_armor', description: 'Armor Played' },
            { type: 'play_buff', description: 'Buff Played' },
            { type: 'play_spell', description: 'Spell Played' },
            { type: 'play_trap', description: 'Trap Played' }
        ],
        targetValues: [1, 1, 1, 1, 1, 1]
    },

    // CHAOS/SITUATIONAL
    {
        id: 'quest_17',
        name: 'Chaos Agent',
        description: 'Cause 2 players to be eliminated.',
        type: CardType.QUEST,
        conditions: [{ type: 'witness_death', description: 'Deaths Witnessed' }],
        targetValues: [2]
    },
    {
        id: 'quest_18',
        name: 'Avenger',
        description: 'Eliminate a player who dealt damage to you.',
        type: CardType.QUEST,
        conditions: [{ type: 'kill_attacker', description: 'Kill Attacker' }],
        targetValues: [1]
    },
    {
        id: 'quest_19',
        name: 'Last Stand',
        description: 'Win with 1 HP remaining.',
        type: CardType.QUEST,
        conditions: [{ type: 'win_1hp', description: 'Win at 1 HP' }],
        targetValues: [1]
    },
    {
        id: 'quest_20',
        name: 'Speedster',
        description: 'Be the first to deal damage in the game.',
        type: CardType.QUEST,
        conditions: [{ type: 'first_blood', description: 'First Blood' }],
        targetValues: [1]
    },
    {
        id: 'quest_21',
        name: 'Rich',
        description: 'Discard 10 cards total.',
        type: CardType.QUEST,
        conditions: [{ type: 'discard_cards', description: 'Cards Discarded' }],
        targetValues: [10]
    },
    {
        id: 'quest_22',
        name: 'Technician',
        description: 'Use character passive ability 5 times.',
        type: CardType.QUEST,
        conditions: [{ type: 'use_passive', description: 'Passive Used' }],
        targetValues: [5]
    },
    {
        id: 'quest_23',
        name: 'Kingslayer',
        description: 'Kill the player with the most HP.',
        type: CardType.QUEST,
        conditions: [{ type: 'kill_leader', description: 'Kill Leader' }],
        targetValues: [1]
    },
    {
        id: 'quest_24',
        name: 'Empty Hand',
        description: 'Have 0 cards in hand at end of turn 3 times.',
        type: CardType.QUEST,
        conditions: [{ type: 'empty_hand', description: 'Empty Hand Turns' }],
        targetValues: [3]
    }
];
