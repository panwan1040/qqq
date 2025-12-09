import { Player } from '../models/Player';
import { Card, ActionCard, SpellCard, TrapCard, RareCard, CardType } from '../models/Card';
import { BuffType, Buff } from '../models/Buff';
import { CombatManager } from './CombatManager';
import { QuestManager, QuestAction } from './QuestManager';

export interface EffectResult {
    success: boolean;
    message: string;
    damageDealt?: number;
    healedAmount?: number;
    armorGained?: number;
    cardsDrawn?: number;
}

export class CardEffectResolver {
    constructor(
        private combatManager: CombatManager,
        private questManager: QuestManager
    ) { }

    resolveEffect(
        card: Card,
        source: Player,
        target: Player | null,
        diceRoll?: number
    ): EffectResult {
        switch (card.type) {
            case CardType.ATTACK:
                return this.resolveAttack(card as ActionCard, source, target!, diceRoll!);
            case CardType.HEAL:
                return this.resolveHeal(card as ActionCard, source);
            case CardType.ARMOR:
                return this.resolveArmor(card as ActionCard, source);
            case CardType.BUFF:
                return this.resolveBuff(card as ActionCard, source);
            case CardType.SPELL:
                return this.resolveSpell(card as SpellCard, source, target);
            case CardType.TRAP:
                return this.resolveTrap(card as TrapCard, source);
            case CardType.RARE:
                return this.resolveRare(card as RareCard, source, target);
            default:
                return { success: false, message: 'Unknown card type' };
        }
    }

    private resolveAttack(
        card: ActionCard,
        source: Player,
        target: Player,
        diceRoll: number
    ): EffectResult {
        const damage = this.combatManager.calculateDamage(source, target, card, diceRoll);

        if (damage === 0) {
            return { success: true, message: 'Attack missed!', damageDealt: 0 };
        }

        // Check for damage reflection
        if (this.combatManager.hasDamageReflection(target)) {
            const reflectValue = this.combatManager.getReflectionValue(target);
            const reflectedDamage = reflectValue > 0 ? reflectValue : damage;
            this.combatManager.applyDamage(source, reflectedDamage);

            // Update quest for source taking reflected damage
            this.questManager.updateProgress(source, { type: 'take_damage', value: reflectedDamage });

            return {
                success: true,
                message: `Attack reflected! ${source.name} took ${reflectedDamage} damage!`,
                damageDealt: 0
            };
        }

        const actualDamage = this.combatManager.applyDamage(target, damage);

        // Update quest progress
        this.questManager.updateProgress(source, { type: 'deal_damage', value: actualDamage });
        this.questManager.updateProgress(target, { type: 'take_damage', value: actualDamage });

        // Check for critical
        if (diceRoll === 8) {
            this.questManager.updateProgress(source, { type: 'critical_hit', value: 1 });
        }

        return {
            success: true,
            message: diceRoll === 8
                ? `Critical Hit! Dealt ${actualDamage} damage!`
                : `Dealt ${actualDamage} damage!`,
            damageDealt: actualDamage
        };
    }

    private resolveHeal(card: ActionCard, source: Player): EffectResult {
        const healBoost = this.getCharacterHealBoost(source);
        const healed = this.combatManager.applyHeal(source, card.value, healBoost);

        this.questManager.updateProgress(source, { type: 'heal_hp', value: healed });

        return {
            success: true,
            message: `Healed ${healed} HP!`,
            healedAmount: healed
        };
    }

    private resolveArmor(card: ActionCard, source: Player): EffectResult {
        this.combatManager.applyArmor(source, card.value);

        return {
            success: true,
            message: `Gained ${card.value} Armor!`,
            armorGained: card.value
        };
    }

    private resolveBuff(card: ActionCard, source: Player): EffectResult {
        if (!card.effect.buffType) {
            return { success: false, message: 'Invalid buff card' };
        }

        const buff: Buff = {
            id: `buff_${Date.now()}`,
            name: card.name,
            type: card.effect.buffType,
            value: card.effect.value,
            duration: card.effect.duration ?? 3,
            source: card.id
        };

        source.buffs.push(buff);

        return {
            success: true,
            message: `Applied ${card.name}!`
        };
    }

    private resolveSpell(
        card: SpellCard,
        source: Player,
        target: Player | null
    ): EffectResult {
        switch (card.effect.type) {
            case 'spell_damage':
                if (!target) return { success: false, message: 'No target selected' };
                // Spells ignore armor
                target.hp = Math.max(0, target.hp - card.effect.value);
                this.questManager.updateProgress(source, { type: 'spell_damage', value: card.effect.value });
                this.questManager.updateProgress(source, { type: 'deal_damage', value: card.effect.value });
                return {
                    success: true,
                    message: `${card.name} dealt ${card.effect.value} damage!`,
                    damageDealt: card.effect.value
                };

            case 'draw':
                // This will be handled by the game manager
                return {
                    success: true,
                    message: `Draw ${card.effect.value} cards!`,
                    cardsDrawn: card.effect.value
                };

            case 'destroy_trap':
                // Check if target has active trap (simplified)
                return { success: true, message: 'Trap destroyed!' };

            default:
                return { success: true, message: `Cast ${card.name}!` };
        }
    }

    private resolveTrap(card: TrapCard, source: Player): EffectResult {
        // Trap is set face-down, not resolved immediately
        return {
            success: true,
            message: 'Trap set!'
        };
    }

    private resolveRare(
        card: RareCard,
        source: Player,
        target: Player | null
    ): EffectResult {
        switch (card.effect.type) {
            case 'shuffle_quests':
                // This requires game-level handling
                return { success: true, message: 'Chaos! All quests shuffled!' };

            case 'damage_all':
                // This requires game-level handling
                return {
                    success: true,
                    message: `Doomsday! All players take ${card.effect.value} damage!`,
                    damageDealt: card.effect.value
                };

            case 'heal_full':
                source.hp = source.maxHp;
                return { success: true, message: 'Miracle! Fully healed!' };

            default:
                return { success: true, message: `Used ${card.name}!` };
        }
    }

    private getCharacterHealBoost(player: Player): number {
        if (player.character?.passiveAbility.effectType === 'heal_boost') {
            return player.character.passiveAbility.value;
        }
        return 0;
    }

    applyBuff(player: Player, buff: Buff): void {
        player.buffs.push(buff);
    }

    decrementBuffDurations(player: Player): void {
        player.buffs = player.buffs.filter(buff => {
            if (buff.duration === -1) return true; // Permanent
            buff.duration--;
            return buff.duration > 0;
        });
    }
}
