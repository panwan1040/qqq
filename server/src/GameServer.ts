import { v4 as uuidv4 } from 'uuid';
import { SanitizedGameState, SanitizedPlayer, PrivatePlayerData, GameActionResult } from './types.js';
import { db } from './db/Database.js';

// Import game logic types (simplified server-side versions)
interface Card {
  id: string;
  name: string;
  type: string;
  description: string;
  [key: string]: any;
}

interface Buff {
  id: string;
  name: string;
  duration: number;
  [key: string]: any;
}

interface Player {
  id: string;
  name: string;
  character: { name: string; [key: string]: any } | null;
  hp: number;
  maxHp: number;
  atk: number;
  armor: number;
  hand: Card[];
  quest: any | null;
  questProgress: any | null;
  buffs: Buff[];
  isAlive: boolean;
}

interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  turnNumber: number;
  turnPhase: string;
  drawDeck: Card[];
  discardPile: Card[];
  activeTrap: any | null;
  winner: Player | null;
  isGameOver: boolean;
  turnOrder: string[];
  actionLog: any[];
}

export class GameServer {
  private gameStates: Map<string, GameState> = new Map();
  private questOptions: Map<string, Map<string, any[]>> = new Map(); // roomId -> playerId -> quests

  // Initialize a new game for a room
  initializeGame(roomId: string, playerNames: string[], playerIds: string[]): GameState {
    const gameId = uuidv4();
    
    // Create players with assigned characters
    const characters = this.getShuffledCharacters(playerNames.length);
    const players: Player[] = playerNames.map((name, index) => ({
      id: playerIds[index],
      name,
      character: characters[index],
      hp: 40,
      maxHp: 40,
      atk: 4,
      armor: characters[index]?.passiveAbility?.effectType === 'start_armor' ? characters[index].passiveAbility.value : 0,
      hand: [],
      quest: null,
      questProgress: null,
      buffs: [],
      isAlive: true
    }));

    // Determine turn order
    const firstPlayerIndex = Math.floor(Math.random() * players.length);
    const turnOrder = this.createTurnOrder(players, firstPlayerIndex);

    // Create deck and deal cards
    const deck = this.createDeck();
    players.forEach(player => {
      player.hand = deck.splice(0, 3);
    });

    const gameState: GameState = {
      id: gameId,
      players,
      currentPlayerIndex: firstPlayerIndex,
      turnNumber: 1,
      turnPhase: 'draw',
      drawDeck: deck,
      discardPile: [],
      activeTrap: null,
      winner: null,
      isGameOver: false,
      turnOrder,
      actionLog: []
    };

    this.gameStates.set(roomId, gameState);
    this.saveGameState(roomId, gameState);

    // Generate quest options for each player
    this.generateQuestOptions(roomId, players);

    return gameState;
  }

  // Get sanitized game state (public info only)
  getSanitizedState(roomId: string): SanitizedGameState | null {
    const state = this.gameStates.get(roomId);
    if (!state) return null;

    return {
      id: state.id,
      players: state.players.map(p => this.sanitizePlayer(p)),
      currentPlayerId: state.players[state.currentPlayerIndex]?.id || '',
      turnNumber: state.turnNumber,
      turnPhase: state.turnPhase,
      drawDeckCount: state.drawDeck.length,
      discardPileCount: state.discardPile.length,
      hasActiveTrap: state.activeTrap !== null,
      isGameOver: state.isGameOver,
      winnerId: state.winner?.id || null
    };
  }

  // Get private data for a specific player
  getPrivateData(roomId: string, playerId: string): PrivatePlayerData | null {
    const state = this.gameStates.get(roomId);
    if (!state) return null;

    const player = state.players.find(p => p.id === playerId);
    if (!player) return null;

    return {
      hand: player.hand,
      quest: player.quest,
      questProgress: player.questProgress
    };
  }

  // Get quest options for a player
  getQuestOptions(roomId: string, playerId: string): any[] {
    return this.questOptions.get(roomId)?.get(playerId) || [];
  }

  // Select quest for a player
  selectQuest(roomId: string, playerId: string, questId: string): boolean {
    const state = this.gameStates.get(roomId);
    if (!state) return false;

    const player = state.players.find(p => p.id === playerId);
    if (!player || player.quest) return false;

    const options = this.getQuestOptions(roomId, playerId);
    const quest = options.find(q => q.id === questId);
    if (!quest) return false;

    player.quest = quest;
    player.questProgress = { current: 0, target: quest.target, isComplete: false };

    this.saveGameState(roomId, state);
    return true;
  }

  // Check if all players have selected quests
  allQuestsSelected(roomId: string): boolean {
    const state = this.gameStates.get(roomId);
    if (!state) return false;
    return state.players.every(p => p.quest !== null);
  }

  // Draw card action
  drawCard(roomId: string, playerId: string): { success: boolean; card?: Card; error?: string } {
    const state = this.gameStates.get(roomId);
    if (!state) return { success: false, error: 'Game not found' };

    const player = state.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: 'Player not found' };

    if (state.drawDeck.length === 0) {
      // Reshuffle discard pile
      if (state.discardPile.length === 0) {
        return { success: false, error: 'No cards available' };
      }
      state.drawDeck = this.shuffle(state.discardPile);
      state.discardPile = [];
    }

    const card = state.drawDeck.pop()!;
    player.hand.push(card);
    state.turnPhase = 'action';

    this.logAction(state, playerId, 'draw', null, null, `Drew a card`);
    this.saveGameState(roomId, state);

    return { success: true, card };
  }

  // Play card action
  playCard(roomId: string, playerId: string, cardId: string, targetId: string | null): GameActionResult {
    const state = this.gameStates.get(roomId);
    if (!state) return { actionType: 'error', playerId, message: 'Game not found' };

    const player = state.players.find(p => p.id === playerId);
    if (!player) return { actionType: 'error', playerId, message: 'Player not found' };

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { actionType: 'error', playerId, message: 'Card not in hand' };

    const card = player.hand[cardIndex];
    const target = targetId ? state.players.find(p => p.id === targetId) : null;

    let result: GameActionResult;

    switch (card.type) {
      case 'attack':
        result = this.resolveAttack(state, player, card, target);
        break;
      case 'heal':
        result = this.resolveHeal(state, player, card);
        break;
      case 'buff':
        result = this.resolveBuff(state, player, card);
        break;
      case 'spell':
        result = this.resolveSpell(state, player, card, target);
        break;
      case 'trap':
        result = this.resolveTrap(state, player, card);
        break;
      default:
        result = { actionType: card.type, playerId, cardName: card.name, message: `Played ${card.name}` };
    }

    // Remove card from hand
    player.hand.splice(cardIndex, 1);
    state.discardPile.push(card);

    // Check win conditions
    this.checkWinConditions(state);
    this.saveGameState(roomId, state);

    return result;
  }

  // Discard card action
  discardCard(roomId: string, playerId: string, cardId: string): boolean {
    const state = this.gameStates.get(roomId);
    if (!state) return false;

    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const card = player.hand.splice(cardIndex, 1)[0];
    state.discardPile.push(card);

    this.logAction(state, playerId, 'discard', cardId, null, `Discarded ${card.name}`);
    this.saveGameState(roomId, state);

    return true;
  }

  // End turn action
  endTurn(roomId: string, playerId: string): boolean {
    const state = this.gameStates.get(roomId);
    if (!state) return false;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) return false;

    // Decrement buff durations
    currentPlayer.buffs = currentPlayer.buffs
      .map(b => ({ ...b, duration: b.duration - 1 }))
      .filter(b => b.duration > 0);

    // Move to next alive player
    let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
    while (!state.players[nextIndex].isAlive && nextIndex !== state.currentPlayerIndex) {
      nextIndex = (nextIndex + 1) % state.players.length;
    }

    state.currentPlayerIndex = nextIndex;
    state.turnNumber++;
    state.turnPhase = 'draw';

    this.saveGameState(roomId, state);
    return true;
  }

  // Load game state from DB
  loadGameState(roomId: string, gameStateId: string): GameState | null {
    const state = db.getGameState(gameStateId);
    if (state) {
      this.gameStates.set(roomId, state);
    }
    return state;
  }

  getGameState(roomId: string): GameState | null {
    return this.gameStates.get(roomId) || null;
  }

  // Private helper methods
  private sanitizePlayer(player: Player): SanitizedPlayer {
    return {
      id: player.id,
      name: player.name,
      characterName: player.character?.name || null,
      hp: player.hp,
      maxHp: player.maxHp,
      atk: player.atk,
      armor: player.armor,
      handCount: player.hand.length,
      buffs: player.buffs.map(b => ({ id: b.id, name: b.name, duration: b.duration })),
      isAlive: player.isAlive,
      hasQuest: player.quest !== null,
      questProgress: player.questProgress ? Math.floor((player.questProgress.current / player.questProgress.target) * 100) : 0
    };
  }

  private resolveAttack(state: GameState, attacker: Player, card: Card, target: Player | null): GameActionResult {
    if (!target) {
      return { actionType: 'attack', playerId: attacker.id, cardName: card.name, message: 'No target' };
    }

    const diceRoll = Math.floor(Math.random() * 8) + 1;
    let damage = 0;
    let message = '';

    if (diceRoll <= 2) {
      message = `${attacker.name} missed!`;
    } else if (diceRoll === 8) {
      damage = (attacker.atk + (card.damage || 0)) * 2;
      message = `Critical hit! ${attacker.name} dealt ${damage} damage to ${target.name}`;
    } else {
      damage = attacker.atk + (card.damage || 0);
      message = `${attacker.name} dealt ${damage} damage to ${target.name}`;
    }

    if (damage > 0) {
      const actualDamage = Math.max(0, damage - target.armor);
      target.hp = Math.max(0, target.hp - actualDamage);
      
      if (target.hp <= 0) {
        target.isAlive = false;
        message += ` - ${target.name} has been eliminated!`;
      }
    }

    this.logAction(state, attacker.id, 'attack', card.id, target.id, message);

    return {
      actionType: 'attack',
      playerId: attacker.id,
      targetId: target.id,
      cardName: card.name,
      diceRoll,
      damage,
      message
    };
  }

  private resolveHeal(state: GameState, player: Player, card: Card): GameActionResult {
    const healAmount = card.healAmount || 5;
    const oldHp = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    const actualHeal = player.hp - oldHp;

    const message = `${player.name} healed for ${actualHeal} HP`;
    this.logAction(state, player.id, 'heal', card.id, null, message);

    return {
      actionType: 'heal',
      playerId: player.id,
      cardName: card.name,
      heal: actualHeal,
      message
    };
  }

  private resolveBuff(state: GameState, player: Player, card: Card): GameActionResult {
    const buff: Buff = {
      id: uuidv4(),
      name: card.buffName || card.name,
      duration: card.duration || 2,
      effect: card.effect
    };
    player.buffs.push(buff);

    const message = `${player.name} gained ${buff.name} for ${buff.duration} turns`;
    this.logAction(state, player.id, 'buff', card.id, null, message);

    return {
      actionType: 'buff',
      playerId: player.id,
      cardName: card.name,
      message
    };
  }

  private resolveSpell(state: GameState, player: Player, card: Card, target: Player | null): GameActionResult {
    let message = `${player.name} cast ${card.name}`;
    
    // Handle different spell effects
    if (card.effect?.type === 'draw') {
      const drawCount = card.effect.value || 1;
      for (let i = 0; i < drawCount && state.drawDeck.length > 0; i++) {
        const drawnCard = state.drawDeck.pop()!;
        player.hand.push(drawnCard);
      }
      message += ` and drew ${drawCount} cards`;
    }

    this.logAction(state, player.id, 'spell', card.id, target?.id || null, message);

    return {
      actionType: 'spell',
      playerId: player.id,
      targetId: target?.id,
      cardName: card.name,
      message
    };
  }

  private resolveTrap(state: GameState, player: Player, card: Card): GameActionResult {
    state.activeTrap = card;
    const message = `${player.name} set a trap!`;
    this.logAction(state, player.id, 'trap', card.id, null, message);

    return {
      actionType: 'trap',
      playerId: player.id,
      cardName: card.name,
      message
    };
  }

  private checkWinConditions(state: GameState): void {
    // Check quest completion
    for (const player of state.players) {
      if (player.isAlive && player.questProgress?.isComplete) {
        state.winner = player;
        state.isGameOver = true;
        return;
      }
    }

    // Check last player standing
    const alivePlayers = state.players.filter(p => p.isAlive);
    if (alivePlayers.length === 1) {
      state.winner = alivePlayers[0];
      state.isGameOver = true;
    }
  }

  private logAction(state: GameState, playerId: string, actionType: string, cardId: string | null, targetId: string | null, message: string): void {
    state.actionLog.push({
      playerId,
      actionType,
      cardId,
      targetId,
      message,
      timestamp: Date.now()
    });
  }

  private saveGameState(roomId: string, state: GameState): void {
    this.gameStates.set(roomId, state);
    db.saveGameState(roomId, state.id, state);
  }

  private generateQuestOptions(roomId: string, players: Player[]): void {
    const roomQuests = new Map<string, any[]>();
    const quests = this.getAvailableQuests();

    players.forEach(player => {
      const shuffled = this.shuffle([...quests]);
      roomQuests.set(player.id, shuffled.slice(0, 3));
    });

    this.questOptions.set(roomId, roomQuests);
  }

  private createTurnOrder(players: Player[], firstIndex: number): string[] {
    const order: string[] = [];
    for (let i = 0; i < players.length; i++) {
      const index = (firstIndex + i) % players.length;
      order.push(players[index].id);
    }
    return order;
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Placeholder methods - these would use actual game data
  private getShuffledCharacters(count: number): any[] {
    const characters = [
      { name: 'Warrior', passiveAbility: { name: 'Battle Fury', effectType: 'on_attack_buff', value: 1 } },
      { name: 'Mage', passiveAbility: { name: 'Arcane Power', effectType: 'spell_boost', value: 2 } },
      { name: 'Rogue', passiveAbility: { name: 'Quick Draw', effectType: 'extra_draw', value: 1 } },
      { name: 'Paladin', passiveAbility: { name: 'Divine Shield', effectType: 'start_armor', value: 2 } },
      { name: 'Ranger', passiveAbility: { name: 'Precision', effectType: 'crit_boost', value: 1 } },
      { name: 'Cleric', passiveAbility: { name: 'Healing Aura', effectType: 'regen', value: 2 } }
    ];
    return this.shuffle(characters).slice(0, count);
  }

  private getAvailableQuests(): any[] {
    return [
      { id: 'q1', name: 'Slayer', description: 'Eliminate 2 players', target: 2, type: 'kill' },
      { id: 'q2', name: 'Survivor', description: 'Be the last one standing', target: 1, type: 'survive' },
      { id: 'q3', name: 'Collector', description: 'Draw 10 cards', target: 10, type: 'draw' },
      { id: 'q4', name: 'Healer', description: 'Heal 20 HP total', target: 20, type: 'heal' },
      { id: 'q5', name: 'Tactician', description: 'Play 5 spell cards', target: 5, type: 'spell' }
    ];
  }

  private createDeck(): Card[] {
    const deck: Card[] = [];
    
    // Attack cards
    for (let i = 0; i < 20; i++) {
      deck.push({ id: `atk_${i}`, name: 'Strike', type: 'attack', description: 'Basic attack', damage: 2 });
    }
    for (let i = 0; i < 10; i++) {
      deck.push({ id: `atk_h_${i}`, name: 'Heavy Strike', type: 'attack', description: 'Heavy attack', damage: 4 });
    }
    
    // Heal cards
    for (let i = 0; i < 12; i++) {
      deck.push({ id: `heal_${i}`, name: 'Healing Potion', type: 'heal', description: 'Restore 5 HP', healAmount: 5 });
    }
    
    // Buff cards
    for (let i = 0; i < 8; i++) {
      deck.push({ id: `buff_${i}`, name: 'Power Up', type: 'buff', description: '+2 ATK for 2 turns', buffName: 'Power', duration: 2, effect: { stat: 'atk', value: 2 } });
    }
    for (let i = 0; i < 6; i++) {
      deck.push({ id: `armor_${i}`, name: 'Shield', type: 'buff', description: '+3 Armor for 2 turns', buffName: 'Shield', duration: 2, effect: { stat: 'armor', value: 3 } });
    }
    
    // Spell cards
    for (let i = 0; i < 8; i++) {
      deck.push({ id: `spell_${i}`, name: 'Arcane Draw', type: 'spell', description: 'Draw 2 cards', effect: { type: 'draw', value: 2 } });
    }
    
    // Trap cards
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `trap_${i}`, name: 'Spike Trap', type: 'trap', description: 'Deal 3 damage to next attacker', damage: 3 });
    }

    return this.shuffle(deck);
  }
}
