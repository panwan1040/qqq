export enum BuffType {
    ATK_BOOST = 'atk_boost',
    ARMOR_BOOST = 'armor_boost',
    SPELL_IMMUNITY = 'spell_immunity',
    GUARANTEED_HIT = 'guaranteed_hit',
    DAMAGE_REFLECTION = 'damage_reflection',
    HEAL_BLOCK = 'heal_block'
}

export interface Buff {
    id: string;
    name: string;
    type: BuffType;
    value: number;
    duration: number; // -1 for permanent
    source: string; // card or passive id
}
