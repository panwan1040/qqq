import { v4 as uuidv4 } from 'uuid';
import { Room, ServerPlayer } from './types.js';
import { db } from './db/Database.js';

export class RoomManager {
  private rooms: Map<string, Room> = new Map(); // code -> Room

  constructor() {
    // Cleanup old rooms on startup
    const cleaned = db.cleanupOldRooms();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old rooms`);
    }
  }

  generateRoomCode(): string {
    // Generate 6-digit code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure unique
    if (this.rooms.has(code) || db.getRoom(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  createRoom(hostName: string, socketId: string): { room: Room; playerId: string } {
    const roomId = uuidv4();
    const roomCode = this.generateRoomCode();
    const playerId = uuidv4();

    const host: ServerPlayer = {
      id: playerId,
      name: hostName,
      socketId,
      isHost: true,
      isConnected: true,
      isReady: true // Host is always ready
    };

    const room: Room = {
      id: roomId,
      code: roomCode,
      hostId: playerId,
      players: [host],
      status: 'waiting',
      maxPlayers: 6,
      createdAt: Date.now(),
      gameStateId: null
    };

    this.rooms.set(roomCode, room);
    db.saveRoom(room);
    db.savePlayerSession(playerId, roomCode, hostName, socketId);

    return { room, playerId };
  }

  joinRoom(roomCode: string, playerName: string, socketId: string): { room: Room; playerId: string } | { error: string } {
    const room = this.getRoom(roomCode);
    
    if (!room) {
      return { error: 'Room not found' };
    }

    if (room.status !== 'waiting') {
      return { error: 'Game already started' };
    }

    if (room.players.length >= room.maxPlayers) {
      return { error: 'Room is full' };
    }

    // Check for duplicate names
    if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      return { error: 'Name already taken' };
    }

    const playerId = uuidv4();
    const player: ServerPlayer = {
      id: playerId,
      name: playerName,
      socketId,
      isHost: false,
      isConnected: true,
      isReady: false
    };

    room.players.push(player);
    this.saveRoom(room);
    db.savePlayerSession(playerId, roomCode, playerName, socketId);

    return { room, playerId };
  }

  leaveRoom(roomCode: string, playerId: string): { room: Room | null; shouldClose: boolean } {
    const room = this.getRoom(roomCode);
    if (!room) return { room: null, shouldClose: false };

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return { room, shouldClose: false };

    const player = room.players[playerIndex];
    
    // If game is in progress, mark as disconnected instead of removing
    if (room.status === 'playing') {
      player.isConnected = false;
      this.saveRoom(room);
      return { room, shouldClose: false };
    }

    // Remove player from waiting room
    room.players.splice(playerIndex, 1);
    db.deletePlayerSession(playerId);

    // If host left, close room or transfer host
    if (player.isHost) {
      if (room.players.length === 0) {
        this.deleteRoom(roomCode);
        return { room: null, shouldClose: true };
      }
      // Transfer host to next player
      room.players[0].isHost = true;
      room.hostId = room.players[0].id;
    }

    this.saveRoom(room);
    return { room, shouldClose: room.players.length === 0 };
  }

  setPlayerReady(roomCode: string, playerId: string, isReady: boolean): Room | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = isReady;
      this.saveRoom(room);
    }
    return room;
  }

  canStartGame(roomCode: string): { canStart: boolean; reason?: string } {
    const room = this.getRoom(roomCode);
    if (!room) return { canStart: false, reason: 'Room not found' };
    
    if (room.players.length < 4) {
      return { canStart: false, reason: 'Need at least 4 players' };
    }

    const allReady = room.players.every(p => p.isReady);
    if (!allReady) {
      return { canStart: false, reason: 'Not all players are ready' };
    }

    return { canStart: true };
  }

  startGame(roomCode: string): Room | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    room.status = 'quest_selection';
    this.saveRoom(room);
    return room;
  }

  updateRoomStatus(roomCode: string, status: Room['status']): Room | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    room.status = status;
    this.saveRoom(room);
    return room;
  }

  setGameStateId(roomCode: string, gameStateId: string): void {
    const room = this.getRoom(roomCode);
    if (room) {
      room.gameStateId = gameStateId;
      this.saveRoom(room);
    }
  }

  reconnectPlayer(roomCode: string, playerId: string, socketId: string): Room | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.socketId = socketId;
      player.isConnected = true;
      this.saveRoom(room);
      db.updatePlayerConnection(playerId, socketId, true);
    }
    return room;
  }

  disconnectPlayer(roomCode: string, playerId: string): Room | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
      this.saveRoom(room);
      db.updatePlayerConnection(playerId, null, false);
    }
    return room;
  }

  getRoom(code: string): Room | null {
    // Check memory first
    let room = this.rooms.get(code);
    if (room) return room;

    // Try loading from DB
    room = db.getRoom(code);
    if (room) {
      this.rooms.set(code, room);
    }
    return room;
  }

  getPlayerRoom(socketId: string): { room: Room; player: ServerPlayer } | null {
    for (const room of this.rooms.values()) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) {
        return { room, player };
      }
    }
    return null;
  }

  private saveRoom(room: Room): void {
    this.rooms.set(room.code, room);
    db.saveRoom(room);
  }

  private deleteRoom(code: string): void {
    this.rooms.delete(code);
    db.deleteRoom(code);
  }
}
