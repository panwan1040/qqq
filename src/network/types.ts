// Shared types for client-server communication

export interface ServerPlayer {
  id: string;
  name: string;
  socketId: string;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: ServerPlayer[];
  status: 'waiting' | 'quest_selection' | 'playing' | 'finished';
  maxPlayers: number;
  createdAt: number;
  gameStateId: string | null;
}

export interface SanitizedPlayer {
  id: string;
  name: string;
  characterName: string | null;
  hp: number;
  maxHp: number;
  atk: number;
  armor: number;
  handCount: number;
  buffs: { id: string; name: string; duration: number }[];
  isAlive: boolean;
  hasQuest: boolean;
  questProgress: number;
}

export interface SanitizedGameState {
  id: string;
  players: SanitizedPlayer[];
  currentPlayerId: string;
  turnNumber: number;
  turnPhase: string;
  drawDeckCount: number;
  discardPileCount: number;
  hasActiveTrap: boolean;
  isGameOver: boolean;
  winnerId: string | null;
}

export interface PrivatePlayerData {
  hand: Card[];
  quest: Quest | null;
  questProgress: QuestProgress | null;
}

export interface Card {
  id: string;
  name: string;
  type: string;
  description: string;
  damage?: number;
  healAmount?: number;
  [key: string]: any;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  target: number;
  type: string;
}

export interface QuestProgress {
  current: number;
  target: number;
  isComplete: boolean;
}

export interface GameActionResult {
  actionType: string;
  playerId: string;
  targetId?: string;
  cardName?: string;
  diceRoll?: number;
  damage?: number;
  heal?: number;
  message: string;
}

export interface RoomResponse {
  success: boolean;
  room?: Room;
  playerId?: string;
  error?: string;
}

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export interface ReconnectResponse {
  success: boolean;
  room?: Room;
  gameState?: SanitizedGameState;
  privateData?: PrivatePlayerData;
  error?: string;
}
