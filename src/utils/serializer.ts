import { GameState } from '../models/GameState';

export const serializeGameState = (state: GameState): string => {
    return JSON.stringify(state);
};

export const deserializeGameState = (json: string): GameState => {
    try {
        const data = JSON.parse(json);
        // In a real app with complex classes (not just interfaces), 
        // we would need here to re-instantiate classes.
        // Since we are using mostly interfaces and POJOs (Plain Old JSON Objects),
        // JSON.parse is usually sufficient, assuming no Maps/Sets/Dates.
        // Timestamp is number, so that's fine.

        // We could add validation here if needed.
        return data as GameState;
    } catch (error) {
        throw new Error('Failed to deserialize game state: ' + error);
    }
};
