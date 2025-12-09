import { Player } from '../models/Player';
import { QuestCard, CardType } from '../models/Card';
import { QuestProgress, QuestCondition } from '../models/Quest';
import { QUESTS } from '../data/quests';
import { shuffle } from '../utils/shuffle';

export interface QuestAction {
    type: string;
    value: number;
    targetId?: string;
}

export class QuestManager {
    private questPool: QuestCard[] = [];

    initialize(): void {
        this.questPool = shuffle(QUESTS.map(q => ({ ...q })));
    }

    assignQuests(player: Player): QuestCard[] {
        if (this.questPool.length < 2) {
            // Reshuffle if needed
            this.questPool = shuffle(QUESTS.map(q => ({ ...q })));
        }
        return [this.questPool.pop()!, this.questPool.pop()!];
    }

    selectQuest(player: Player, quest: QuestCard): void {
        player.quest = quest;
        player.questProgress = {
            questId: quest.id,
            conditions: quest.conditions,
            currentValues: quest.conditions.map(() => 0),
            isComplete: false
        };
    }

    updateProgress(player: Player, action: QuestAction): void {
        if (!player.quest || !player.questProgress) return;

        const { conditions, currentValues } = player.questProgress;

        for (let i = 0; i < conditions.length; i++) {
            if (conditions[i].type === action.type) {
                currentValues[i] += action.value;
            }
        }

        // Check completion
        this.checkCompletion(player);
    }

    checkCompletion(player: Player): boolean {
        if (!player.quest || !player.questProgress) return false;

        const { conditions, currentValues } = player.questProgress;
        const targetValues = player.quest.targetValues;

        const isComplete = conditions.every((_, i) => currentValues[i] >= targetValues[i]);
        player.questProgress.isComplete = isComplete;

        return isComplete;
    }

    getProgress(player: Player): QuestProgress | null {
        return player.questProgress;
    }

    resetQuest(player: Player): void {
        // Reset current quest and assign new one
        const newQuests = this.assignQuests(player);
        // Assign first one directly
        this.selectQuest(player, newQuests[0]);
    }

    getRemainingQuestsCount(): number {
        return this.questPool.length;
    }

    setQuestPool(quests: QuestCard[]): void {
        this.questPool = [...quests];
    }

    getQuestPool(): QuestCard[] {
        return [...this.questPool];
    }
}
