export interface QuestCondition {
    type: string; // e.g. 'deal_damage', 'survive_turns', 'kill_player'
    description: string;
    // targetValue might be here or in QuestCard, doc says QuestCard has targetValues[]
    // We'll keep it consistent with QuestCard's targetValues[] parallel array for now
    // or put it here for cleaner model if allowed. 
    // Design doc: "conditions: QuestCondition[]; targetValues: number[];"
}

export interface QuestProgress {
    questId: string;
    conditions: QuestCondition[];
    currentValues: number[];
    isComplete: boolean;
}
