import { Room } from '../types.js';

// In-memory storage (can be replaced with Redis or actual DB later)
export class GameDatabase {
  private rooms: Map<string, Room> = new Map();
  private gameStates: Map<string, any> = new Map();
  private playerSessions: Map<string, { roomCode: string; playerName: string; socketId: string | null; isConnected: boolean; lastSeen: number }> = new Map();

  constructor() {
    // Cleanup old data periodically
    setInterval(() => this.cleanupOldRooms(), 60 * 60 * 1000); // Every hour
  }

  // Room operations
  saveRoom(room: Room): void {
    this.rooms.set(room.code, room);
  }

  getRoom(code: string): Room | null {
    return this.rooms.get(code) || null;
  }

  getRoomById(id: string): Room | null {
    for (const room of this.rooms.values()) {
      if (room.id === id) return room;
    }
    return null;
  }

  deleteRoom(code: string): void {
    this.rooms.delete(code);
  }

  // Game state operations
  saveGameState(roomId: string, stateId: string, state: any): void {
    this.gameStates.set(stateId, { roomId, state, updatedAt: Date.now() });
  }

  getGameState(stateId: string): any | null {
    const data = this.gameStates.get(stateId);
    return data ? data.state : null;
  }

  // Player session operations
  savePlayerSession(playerId: string, roomCode: string, playerName: string, socketId: string): void {
    this.playerSessions.set(playerId, {
      roomCode,
      playerName,
      socketId,
      isConnected: true,
      lastSeen: Date.now()
    });
  }

  updatePlayerConnection(playerId: string, socketId: string | null, isConnected: boolean): void {
    const session = this.playerSessions.get(playerId);
    if (session) {
      session.socketId = socketId;
      session.isConnected = isConnected;
      session.lastSeen = Date.now();
    }
  }

  getPlayerSession(playerId: string): { roomCode: string; playerName: string } | null {
    const session = this.playerSessions.get(playerId);
    return session ? { roomCode: session.roomCode, playerName: session.playerName } : null;
  }

  deletePlayerSession(playerId: string): void {
    this.playerSessions.delete(playerId);
  }

  // Cleanup old rooms (older than 24 hours)
  cleanupOldRooms(): number {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    let cleaned = 0;
    
    for (const [code, room] of this.rooms.entries()) {
      if (room.createdAt < cutoff) {
        this.rooms.delete(code);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  // Get stats
  getStats() {
    return {
      rooms: this.rooms.size,
      gameStates: this.gameStates.size,
      sessions: this.playerSessions.size
    };
  }

  close(): void {
    // No-op for in-memory storage
  }
}

export const db = new GameDatabase();
