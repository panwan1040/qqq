import { create } from 'zustand';
import { socketClient } from '../network/SocketClient';
import {
  Room,
  SanitizedGameState,
  PrivatePlayerData,
  GameActionResult,
  Quest,
  Card
} from '../network/types';

type GamePhase = 'lobby' | 'room' | 'quest_selection' | 'playing' | 'game_over';

interface MultiplayerStore {
  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Room
  room: Room | null;
  playerId: string | null;
  isHost: boolean;

  // Game State
  gamePhase: GamePhase;
  gameState: SanitizedGameState | null;
  privateData: PrivatePlayerData | null;
  questOptions: Quest[];

  // UI State
  selectedCardId: string | null;
  selectedTargetId: string | null;
  lastActionResult: GameActionResult | null;
  errorMessage: string | null;

  // Actions
  connect: () => Promise<void>;
  createRoom: (playerName: string) => Promise<boolean>;
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  leaveRoom: () => void;
  setReady: (isReady: boolean) => void;
  startGame: () => Promise<boolean>;
  selectQuest: (questId: string) => Promise<boolean>;
  drawCard: () => Promise<boolean>;
  playCard: () => Promise<boolean>;
  discardCard: (cardId: string) => Promise<boolean>;
  endTurn: () => Promise<boolean>;
  selectCard: (cardId: string | null) => void;
  selectTarget: (targetId: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => {
  // Setup socket event listeners
  socketClient.on('connectionChange', (connected) => {
    set({ isConnected: connected, isConnecting: false });
  });

  socketClient.on('roomUpdated', (room) => {
    const playerId = socketClient.getPlayerId();
    const isHost = room.hostId === playerId;
    set({ room, isHost });
  });

  socketClient.on('playerJoined', (player) => {
    const { room } = get();
    if (room) {
      set({ room: { ...room, players: [...room.players, player] } });
    }
  });

  socketClient.on('playerLeft', (playerId) => {
    const { room } = get();
    if (room) {
      set({ room: { ...room, players: room.players.filter(p => p.id !== playerId) } });
    }
  });

  socketClient.on('roomClosed', (reason) => {
    set({ 
      room: null, 
      gamePhase: 'lobby', 
      errorMessage: reason 
    });
  });

  socketClient.on('gameStarted', () => {
    set({ gamePhase: 'quest_selection' });
  });

  socketClient.on('questOptions', (quests) => {
    set({ questOptions: quests });
  });

  socketClient.on('stateUpdate', (state) => {
    const { gamePhase } = get();
    set({ 
      gameState: state,
      gamePhase: state.isGameOver ? 'game_over' : (gamePhase === 'quest_selection' ? 'playing' : gamePhase)
    });
  });

  socketClient.on('privateData', (data) => {
    set({ privateData: data });
  });

  socketClient.on('actionResult', (result) => {
    set({ lastActionResult: result });
  });

  socketClient.on('gameOver', ({ winnerId, winnerName }) => {
    set({ gamePhase: 'game_over' });
  });

  socketClient.on('error', ({ message }) => {
    set({ errorMessage: message });
  });

  socketClient.on('playerDisconnected', (playerId) => {
    const { room } = get();
    if (room) {
      const updatedPlayers = room.players.map(p => 
        p.id === playerId ? { ...p, isConnected: false } : p
      );
      set({ room: { ...room, players: updatedPlayers } });
    }
  });

  socketClient.on('playerReconnected', (playerId) => {
    const { room } = get();
    if (room) {
      const updatedPlayers = room.players.map(p => 
        p.id === playerId ? { ...p, isConnected: true } : p
      );
      set({ room: { ...room, players: updatedPlayers } });
    }
  });

  return {
    // Initial state
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    room: null,
    playerId: null,
    isHost: false,
    gamePhase: 'lobby',
    gameState: null,
    privateData: null,
    questOptions: [],
    selectedCardId: null,
    selectedTargetId: null,
    lastActionResult: null,
    errorMessage: null,

    // Actions
    connect: async () => {
      set({ isConnecting: true, connectionError: null });
      try {
        await socketClient.connect();
        set({ 
          isConnected: true, 
          isConnecting: false,
          playerId: socketClient.getPlayerId()
        });
      } catch (error: any) {
        set({ 
          isConnecting: false, 
          connectionError: error.message || 'Failed to connect' 
        });
      }
    },

    createRoom: async (playerName) => {
      const response = await socketClient.createRoom(playerName);
      if (response.success && response.room) {
        set({ 
          room: response.room, 
          playerId: response.playerId || null,
          isHost: true,
          gamePhase: 'room'
        });
        return true;
      }
      set({ errorMessage: response.error || 'Failed to create room' });
      return false;
    },

    joinRoom: async (roomCode, playerName) => {
      const response = await socketClient.joinRoom(roomCode, playerName);
      if (response.success && response.room) {
        set({ 
          room: response.room, 
          playerId: response.playerId || null,
          isHost: false,
          gamePhase: 'room'
        });
        return true;
      }
      set({ errorMessage: response.error || 'Failed to join room' });
      return false;
    },

    leaveRoom: () => {
      socketClient.leaveRoom();
      set({ 
        room: null, 
        gamePhase: 'lobby',
        gameState: null,
        privateData: null,
        questOptions: []
      });
    },

    setReady: (isReady) => {
      socketClient.setReady(isReady);
    },

    startGame: async () => {
      const response = await socketClient.startGame();
      if (!response.success) {
        set({ errorMessage: response.error || 'Failed to start game' });
      }
      return response.success;
    },

    selectQuest: async (questId) => {
      const response = await socketClient.selectQuest(questId);
      if (!response.success) {
        set({ errorMessage: response.error || 'Failed to select quest' });
      }
      return response.success;
    },

    drawCard: async () => {
      const response = await socketClient.drawCard();
      if (!response.success) {
        set({ errorMessage: response.error || 'Failed to draw card' });
      }
      return response.success;
    },

    playCard: async () => {
      const { selectedCardId, selectedTargetId } = get();
      if (!selectedCardId) return false;

      const response = await socketClient.playCard(selectedCardId, selectedTargetId);
      if (response.success) {
        set({ selectedCardId: null, selectedTargetId: null });
      } else {
        set({ errorMessage: response.error || 'Failed to play card' });
      }
      return response.success;
    },

    discardCard: async (cardId) => {
      const response = await socketClient.discardCard(cardId);
      if (!response.success) {
        set({ errorMessage: response.error || 'Failed to discard card' });
      }
      return response.success;
    },

    endTurn: async () => {
      const response = await socketClient.endTurn();
      if (!response.success) {
        set({ errorMessage: response.error || 'Failed to end turn' });
      }
      return response.success;
    },

    selectCard: (cardId) => {
      set({ selectedCardId: cardId });
    },

    selectTarget: (targetId) => {
      set({ selectedTargetId: targetId });
    },

    clearError: () => {
      set({ errorMessage: null });
    },

    reset: () => {
      socketClient.leaveRoom();
      set({
        room: null,
        gamePhase: 'lobby',
        gameState: null,
        privateData: null,
        questOptions: [],
        selectedCardId: null,
        selectedTargetId: null,
        lastActionResult: null,
        errorMessage: null
      });
    }
  };
});
