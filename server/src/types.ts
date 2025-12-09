// Shared types for server-client communication

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
  handCount: number; // ไม่ส่งการ์ดจริง
  buffs: { id: string; name: string; duration: number }[];
  isAlive: boolean;
  hasQuest: boolean; // ไม่บอกว่า quest อะไร
  questProgress: number; // 0-100%
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
  hand: any[]; // Cards
  quest: any | null;
  questProgress: any | null;
}

// Client -> Server Events
export interface ClientToServerEvents {
  // Room
  'room:create': (playerName: string, callback: (res: RoomResponse) => void) => void;
  'room:join': (roomCode: string, playerName: string, callback: (res: RoomResponse) => void) => void;
  'room:leave': () => void;
  'room:ready': (isReady: boolean) => void;
  'room:start': (callback: (res: ActionResponse) => void) => void;
  
  // Game Actions
  'game:selectQuest': (questId: string, callback: (res: ActionResponse) => void) => void;
  'game:drawCard': (callback: (res: ActionResponse) => void) => void;
  'game:playCard': (cardId: string, targetId: string | null, callback: (res: ActionResponse) => void) => void;
  'game:discardCard': (cardId: string, callback: (res: ActionResponse) => void) => void;
  'game:endTurn': (callback: (res: ActionResponse) => void) => void;
  
  // Reconnection
  'reconnect:attempt': (roomCode: string, playerId: string, callback: (res: ReconnectResponse) => void) => void;
}

// Server -> Client Events
export interface ServerToClientEvents {
  // Room updates
  'room:updated': (room: Room) => void;
  'room:playerJoined': (player: ServerPlayer) => void;
  'room:playerLeft': (playerId: string) => void;
  'room:closed': (reason: string) => void;
  
  // Game state
  'game:started': () => void;
  'game:stateUpdate': (state: SanitizedGameState) => void;
  'game:privateData': (data: PrivatePlayerData) => void;
  'game:questOptions': (quests: any[]) => void;
  'game:actionResult': (result: GameActionResult) => void;
  'game:over': (winnerId: string, winnerName: string) => void;
  
  // Errors
  'error': (error: ErrorPayload) => void;
  
  // Connection
  'player:reconnected': (playerId: string) => void;
  'player:disconnected': (playerId: string) => void;
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

export interface ErrorPayload {
  code: string;
  message: string;
}
