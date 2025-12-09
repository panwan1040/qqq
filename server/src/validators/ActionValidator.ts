import { Room } from '../types.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class ActionValidator {
  // Validate room code format
  static validateRoomCode(code: string): ValidationResult {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Invalid room code' };
    }
    if (!/^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
      return { valid: false, error: 'Room code must be 6 characters' };
    }
    return { valid: true };
  }

  // Validate player name
  static validatePlayerName(name: string): ValidationResult {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Name is required' };
    }
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      return { valid: false, error: 'Name must be 2-20 characters' };
    }
    if (!/^[a-zA-Z0-9\u0E00-\u0E7F\s]+$/.test(trimmed)) {
      return { valid: false, error: 'Name contains invalid characters' };
    }
    return { valid: true };
  }

  // Validate it's player's turn
  static validatePlayerTurn(gameState: any, playerId: string): ValidationResult {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return { valid: false, error: 'Not your turn' };
    }
    return { valid: true };
  }

  // Validate player is in room
  static validatePlayerInRoom(room: Room, playerId: string): ValidationResult {
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return { valid: false, error: 'Player not in room' };
    }
    return { valid: true };
  }

  // Validate player is host
  static validateIsHost(room: Room, playerId: string): ValidationResult {
    if (room.hostId !== playerId) {
      return { valid: false, error: 'Only host can perform this action' };
    }
    return { valid: true };
  }

  // Validate draw action
  static validateDrawAction(gameState: any, playerId: string): ValidationResult {
    const turnCheck = this.validatePlayerTurn(gameState, playerId);
    if (!turnCheck.valid) return turnCheck;

    if (gameState.turnPhase !== 'draw') {
      return { valid: false, error: 'Cannot draw in this phase' };
    }

    if (gameState.drawDeck.length === 0) {
      return { valid: false, error: 'No cards in deck' };
    }

    return { valid: true };
  }

  // Validate play card action
  static validatePlayCard(gameState: any, playerId: string, cardId: string, targetId: string | null): ValidationResult {
    const turnCheck = this.validatePlayerTurn(gameState, playerId);
    if (!turnCheck.valid) return turnCheck;

    if (gameState.turnPhase !== 'action') {
      return { valid: false, error: 'Cannot play cards in this phase' };
    }

    const player = gameState.players.find((p: any) => p.id === playerId);
    if (!player) {
      return { valid: false, error: 'Player not found' };
    }

    const card = player.hand.find((c: any) => c.id === cardId);
    if (!card) {
      return { valid: false, error: 'Card not in hand' };
    }

    // Validate target for attack cards
    if (card.type === 'attack') {
      if (!targetId) {
        return { valid: false, error: 'Attack requires a target' };
      }
      const target = gameState.players.find((p: any) => p.id === targetId);
      if (!target) {
        return { valid: false, error: 'Target not found' };
      }
      if (!target.isAlive) {
        return { valid: false, error: 'Cannot attack dead player' };
      }
      if (target.id === playerId) {
        return { valid: false, error: 'Cannot attack yourself' };
      }
    }

    return { valid: true };
  }

  // Validate discard action
  static validateDiscard(gameState: any, playerId: string, cardId: string): ValidationResult {
    const player = gameState.players.find((p: any) => p.id === playerId);
    if (!player) {
      return { valid: false, error: 'Player not found' };
    }

    const card = player.hand.find((c: any) => c.id === cardId);
    if (!card) {
      return { valid: false, error: 'Card not in hand' };
    }

    return { valid: true };
  }

  // Validate end turn action
  static validateEndTurn(gameState: any, playerId: string): ValidationResult {
    const turnCheck = this.validatePlayerTurn(gameState, playerId);
    if (!turnCheck.valid) return turnCheck;

    const player = gameState.players.find((p: any) => p.id === playerId);
    if (player && player.hand.length > 7) {
      return { valid: false, error: 'Must discard to hand limit first' };
    }

    return { valid: true };
  }

  // Validate quest selection
  static validateQuestSelection(gameState: any, playerId: string, questId: string, questOptions: any[]): ValidationResult {
    const player = gameState.players.find((p: any) => p.id === playerId);
    if (!player) {
      return { valid: false, error: 'Player not found' };
    }

    if (player.quest) {
      return { valid: false, error: 'Quest already selected' };
    }

    const validQuest = questOptions.find(q => q.id === questId);
    if (!validQuest) {
      return { valid: false, error: 'Invalid quest selection' };
    }

    return { valid: true };
  }

  // Sanitize string input
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    return input.trim().slice(0, 100);
  }
}
