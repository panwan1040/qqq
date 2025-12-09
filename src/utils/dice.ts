export type DiceOutcome = 'miss' | 'hit' | 'critical';

export const rollD8 = (): number => {
    return Math.floor(Math.random() * 8) + 1;
};

export const getDiceOutcome = (roll: number): DiceOutcome => {
    if (roll <= 2) return 'miss';
    if (roll === 8) return 'critical';
    return 'hit';
};
