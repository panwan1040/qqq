import { io, Socket } from 'socket.io-client';
import {
  Room,
  ServerPlayer,
  SanitizedGameState,
  PrivatePlayerData,
  GameActionResult,
  RoomResponse,
  ActionResponse,
  ReconnectResponse,
  Quest
} from './types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

type EventCallback<T> = (data: T) => void;

export class SocketClient {
  private socket: Socket | null = null;
  private playerId: string | null = null;
  private roomCode: string | null = null;

  // Event handlers
  private onRoomUpdated?: EventCallback<Room>;
  private onPlayerJoined?: EventCallback<ServerPlayer>;
  private onPlayerLeft?: EventCallback<string>;
  private onRoomClosed?: EventCallback<string>;
  private onGameStarted?: EventCallback<void>;
  private onStateUpdate?: EventCallback<SanitizedGameState>;
  private onPrivateData?: EventCallback<PrivatePlayerData>;
  private onQuestOptions?: EventCallback<Quest[]>;
  private onActionResult?: EventCallback<GameActionResult>;
  private onGameOver?: EventCallback<{ winnerId: string; winnerName: string }>;
  private onError?: EventCallback<{ code: string; message: string }>;
  private onPlayerReconnected?: EventCallback<string>;
  private onPlayerDisconnected?: EventCallback<string>;
  private onConnectionChange?: EventCallback<boolean>;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.onConnectionChange?.(true);
        
        // Try to reconnect to previous room
        this.tryReconnect();
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.onConnectionChange?.(false);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      // Setup event listeners
      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('room:updated', (room: Room) => {
      this.onRoomUpdated?.(room);
    });

    this.socket.on('room:playerJoined', (player: ServerPlayer) => {
      this.onPlayerJoined?.(player);
    });

    this.socket.on('room:playerLeft', (playerId: string) => {
      this.onPlayerLeft?.(playerId);
    });

    this.socket.on('room:closed', (reason: string) => {
      this.clearSession();
      this.onRoomClosed?.(reason);
    });

    this.socket.on('game:started', () => {
      this.onGameStarted?.();
    });

    this.socket.on('game:stateUpdate', (state: SanitizedGameState) => {
      this.onStateUpdate?.(state);
    });

    this.socket.on('game:privateData', (data: PrivatePlayerData) => {
      this.onPrivateData?.(data);
    });

    this.socket.on('game:questOptions', (quests: Quest[]) => {
      this.onQuestOptions?.(quests);
    });

    this.socket.on('game:actionResult', (result: GameActionResult) => {
      this.onActionResult?.(result);
    });

    this.socket.on('game:over', (winnerId: string, winnerName: string) => {
      this.onGameOver?.({ winnerId, winnerName });
    });

    this.socket.on('error', (error: { code: string; message: string }) => {
      this.onError?.(error);
    });

    this.socket.on('player:reconnected', (playerId: string) => {
      this.onPlayerReconnected?.(playerId);
    });

    this.socket.on('player:disconnected', (playerId: string) => {
      this.onPlayerDisconnected?.(playerId);
    });
  }

  private tryReconnect() {
    const savedSession = this.loadSession();
    if (savedSession && this.socket) {
      this.socket.emit('reconnect:attempt', savedSession.roomCode, savedSession.playerId, 
        (response: ReconnectResponse) => {
          if (response.success) {
            this.playerId = savedSession.playerId;
            this.roomCode = savedSession.roomCode;
            
            if (response.room) this.onRoomUpdated?.(response.room);
            if (response.gameState) this.onStateUpdate?.(response.gameState);
            if (response.privateData) this.onPrivateData?.(response.privateData);
          } else {
            this.clearSession();
          }
        }
      );
    }
  }

  // Room Actions
  createRoom(playerName: string): Promise<RoomResponse> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('room:create', playerName, (response: RoomResponse) => {
        if (response.success && response.room && response.playerId) {
          this.playerId = response.playerId;
          this.roomCode = response.room.code;
          this.saveSession();
        }
        resolve(response);
      });
    });
  }

  joinRoom(roomCode: string, playerName: string): Promise<RoomResponse> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('room:join', roomCode.toUpperCase(), playerName, (response: RoomResponse) => {
        if (response.success && response.room && response.playerId) {
          this.playerId = response.playerId;
          this.roomCode = response.room.code;
          this.saveSession();
        }
        resolve(response);
      });
    });
  }

  leaveRoom(): void {
    this.socket?.emit('room:leave');
    this.clearSession();
  }

  setReady(isReady: boolean): void {
    this.socket?.emit('room:ready', isReady);
  }

  startGame(): Promise<ActionResponse> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('room:start', (response: ActionResponse) => {
        resolve(response);
      });
    });
  }

  // Game Actions
  selectQuest(questId: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('game:selectQuest', questId, (response: ActionResponse) => {
        resolve(response);
      });
    });
  }

  drawCard(): Promise<ActionResponse> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('game:drawCard', (response: ActionResponse) => {
        resolve(response);
      });
    });
  }

  playCard(cardId: string, targetId: string | null): Promise<ActionResponse> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('game:playCard', cardId, targetId, (response: ActionResponse) => {
        resolve(response);
      });
    });
  }

  discardCard(cardId: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('game:discardCard', cardId, (response: ActionResponse) => {
        resolve(response);
      });
    });
  }

  endTurn(): Promise<ActionResponse> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('game:endTurn', (response: ActionResponse) => {
        resolve(response);
      });
    });
  }

  // Event Subscriptions
  on(event: 'roomUpdated', callback: EventCallback<Room>): void;
  on(event: 'playerJoined', callback: EventCallback<ServerPlayer>): void;
  on(event: 'playerLeft', callback: EventCallback<string>): void;
  on(event: 'roomClosed', callback: EventCallback<string>): void;
  on(event: 'gameStarted', callback: EventCallback<void>): void;
  on(event: 'stateUpdate', callback: EventCallback<SanitizedGameState>): void;
  on(event: 'privateData', callback: EventCallback<PrivatePlayerData>): void;
  on(event: 'questOptions', callback: EventCallback<Quest[]>): void;
  on(event: 'actionResult', callback: EventCallback<GameActionResult>): void;
  on(event: 'gameOver', callback: EventCallback<{ winnerId: string; winnerName: string }>): void;
  on(event: 'error', callback: EventCallback<{ code: string; message: string }>): void;
  on(event: 'playerReconnected', callback: EventCallback<string>): void;
  on(event: 'playerDisconnected', callback: EventCallback<string>): void;
  on(event: 'connectionChange', callback: EventCallback<boolean>): void;
  on(event: string, callback: EventCallback<any>): void {
    switch (event) {
      case 'roomUpdated': this.onRoomUpdated = callback; break;
      case 'playerJoined': this.onPlayerJoined = callback; break;
      case 'playerLeft': this.onPlayerLeft = callback; break;
      case 'roomClosed': this.onRoomClosed = callback; break;
      case 'gameStarted': this.onGameStarted = callback; break;
      case 'stateUpdate': this.onStateUpdate = callback; break;
      case 'privateData': this.onPrivateData = callback; break;
      case 'questOptions': this.onQuestOptions = callback; break;
      case 'actionResult': this.onActionResult = callback; break;
      case 'gameOver': this.onGameOver = callback; break;
      case 'error': this.onError = callback; break;
      case 'playerReconnected': this.onPlayerReconnected = callback; break;
      case 'playerDisconnected': this.onPlayerDisconnected = callback; break;
      case 'connectionChange': this.onConnectionChange = callback; break;
    }
  }

  // Session Management
  private saveSession(): void {
    if (this.playerId && this.roomCode) {
      localStorage.setItem('hq_session', JSON.stringify({
        playerId: this.playerId,
        roomCode: this.roomCode
      }));
    }
  }

  private loadSession(): { playerId: string; roomCode: string } | null {
    try {
      const data = localStorage.getItem('hq_session');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    this.playerId = null;
    this.roomCode = null;
    localStorage.removeItem('hq_session');
  }

  // Getters
  getPlayerId(): string | null {
    return this.playerId;
  }

  getRoomCode(): string | null {
    return this.roomCode;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

// Singleton instance
export const socketClient = new SocketClient();
