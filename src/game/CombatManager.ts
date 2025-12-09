import { Player } from '../models/Player';
import { ActionCard, Card, CardType } from '../models/Card';
import { rollD8, getDiceOutcome, DiceOutcome } from '../utils/dice';
import { BuffType } from '../models/Buff';

export interface DiceResult {
    value: number;
    outcome: DiceOutcome;
}

export class CombatManager {
    rollD8(): DiceResult {
        const value = rollD8();
        return {
            value,
            outcome: getDiceOutcome(value)
        };
    }

    calculateDamage(
        attacker: Player,
        target: Player,
        card: ActionCard,
        roll: number,
        characterPassiveModifier: number = 0
    ): number {
        const outcome = getDiceOutcome(roll);

        if (outcome === 'miss') {
            return 0;
        }

        let baseDamage = card.value + characterPassiveModifier;

        // Apply ATK buffs from player
        const atkBuff = attacker.buffs
            .filter(b => b.type === BuffType.ATK_BOOST)
            .reduce((sum, b) => sum + b.value, 0);
        baseDamage += atkBuff;

        if (outcome === 'critical') {
            baseDamage *= 2;
        }

        return baseDamage;
    }

    applyDamage(target: Player, damage: number): number {
        // Apply armor reduction
        const armorReduction = Math.min(target.armor, damage);
        const finalDamage = Math.max(0, damage - target.armor);

        // Reduce armor
        target.armor = Math.max(0, target.armor - damage);

        // Apply damage to HP
        target.hp = Math.max(0, target.hp - finalDamage);

        return finalDamage;
    }

    applyArmor(player: Player, amount: number): void {
        player.armor += amount;
    }

    applyHeal(player: Player, amount: number, healBoost: number = 0): number {
        // Check for heal block
        const hasHealBlock = player.buffs.some(b => b.type === BuffType.HEAL_BLOCK);
        if (hasHealBlock) {
            return 0;
        }

        const totalHeal = amount + healBoost;
        const previousHp = player.hp;
        player.hp = Math.min(player.maxHp, player.hp + totalHeal);
        return player.hp - previousHp;
    }

    checkDeath(player: Player): boolean {
        if (player.hp <= 0) {
            player.isAlive = false;
            player.isEliminated = true;
            return true;
        }
        return false;
    }

    revivePlayer(player: Player): void {
        player.hp = 15;
        player.isAlive = true;
        player.isEliminated = false;
    }

    hasGuaranteedHit(player: Player): boolean {
        return player.buffs.some(b => b.type === BuffType.GUARANTEED_HIT);
    }

    hasDamageReflection(player: Player): boolean {
        return player.buffs.some(b => b.type === BuffType.DAMAGE_REFLECTION);
    }

    getReflectionValue(player: Player): number {
        const reflectBuff = player.buffs.find(b => b.type === BuffType.DAMAGE_REFLECTION);
        return reflectBuff?.value ?? 0;
    }
}
