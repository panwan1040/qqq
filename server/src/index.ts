import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager.js';
import { GameServer } from './GameServer.js';
import { ActionValidator } from './validators/ActionValidator.js';
import { 
  ClientToServerEvents, 
  ServerToClientEvents,
  ServerPlayer 
} from './types.js';
import { existsSync, mkdirSync } from 'fs';

// Ensure data directory exists
if (!existsSync('./data')) {
  mkdirSync('./data', { recursive: true });
}

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const roomManager = new RoomManager();
const gameServer = new GameServer();

// Track socket -> player mapping
const socketToPlayer = new Map<string, { roomCode: string; playerId: string }>();

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log(`Client connected: ${socket.id}`);

  // Create Room
  socket.on('room:create', (playerName, callback) => {
    const validation = ActionValidator.validatePlayerName(playerName);
    if (!validation.valid) {
      callback({ success: false, error: validation.error });
      return;
    }

    const sanitizedName = ActionValidator.sanitizeString(playerName);
    const { room, playerId } = roomManager.createRoom(sanitizedName, socket.id);
    
    socketToPlayer.set(socket.id, { roomCode: room.code, playerId });
    socket.join(room.code);

    console.log(`Room created: ${room.code} by ${sanitizedName}`);
    callback({ success: true, room, playerId });
  });

  // Join Room
  socket.on('room:join', (roomCode, playerName, callback) => {
    const codeValidation = ActionValidator.validateRoomCode(roomCode);
    if (!codeValidation.valid) {
      callback({ success: false, error: codeValidation.error });
      return;
    }

    const nameValidation = ActionValidator.validatePlayerName(playerName);
    if (!nameValidation.valid) {
      callback({ success: false, error: nameValidation.error });
      return;
    }

    const sanitizedName = ActionValidator.sanitizeString(playerName);
    const result = roomManager.joinRoom(roomCode.toUpperCase(), sanitizedName, socket.id);

    if ('error' in result) {
      callback({ success: false, error: result.error });
      return;
    }

    const { room, playerId } = result;
    socketToPlayer.set(socket.id, { roomCode: room.code, playerId });
    socket.join(room.code);

    // Notify others
    const newPlayer = room.players.find(p => p.id === playerId)!;
    socket.to(room.code).emit('room:playerJoined', newPlayer);

    console.log(`${sanitizedName} joined room ${room.code}`);
    callback({ success: true, room, playerId });
  });

  // Leave Room
  socket.on('room:leave', () => {
    handlePlayerLeave(socket);
  });

  // Ready Toggle
  socket.on('room:ready', (isReady) => {
    const playerInfo = socketToPlayer.get(socket.id);
    if (!playerInfo) return;

    const room = roomManager.setPlayerReady(playerInfo.roomCode, playerInfo.playerId, isReady);
    if (room) {
      io.to(room.code).emit('room:updated', room);
    }
  });

  // Start Game
  socket.on('room:start', (callback) => {
    const playerInfo = socketToPlayer.get(socket.id);
    if (!playerInfo) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }

    const room = roomManager.getRoom(playerInfo.roomCode);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    // Validate host
    const hostValidation = ActionValidator.validateIsHost(room, playerInfo.playerId);
    if (!hostValidation.valid) {
      callback({ success: false, error: hostValidation.error });
      return;
    }

    // Validate can start
    const canStart = roomManager.canStartGame(playerInfo.roomCode);
    if (!canStart.canStart) {
      callback({ success: false, error: canStart.reason });
      return;
    }

    // Initialize game
    const playerNames = room.players.map(p => p.name);
    const playerIds = room.players.map(p => p.id);
    const gameState = gameServer.initializeGame(room.id, playerNames, playerIds);

    roomManager.setGameStateId(room.code, gameState.id);
    roomManager.startGame(room.code);

    // Notify all players
    io.to(room.code).emit('game:started');

    // Send quest options to each player
    room.players.forEach(player => {
      const playerSocket = io.sockets.sockets.get(player.socketId);
      if (playerSocket) {
        const questOptions = gameServer.getQuestOptions(room.id, player.id);
        playerSocket.emit('game:questOptions', questOptions);
      }
    });

    callback({ success: true });
  });

  // Select Quest
  socket.on('game:selectQuest', (questId, callback) => {
    const playerInfo = socketToPlayer.get(socket.id);
    if (!playerInfo) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }

    const room = roomManager.getRoom(playerInfo.roomCode);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const success = gameServer.selectQuest(room.id, playerInfo.playerId, questId);
    if (!success) {
      callback({ success: false, error: 'Invalid quest selection' });
      return;
    }

    // Send updated private data
    const privateData = gameServer.getPrivateData(room.id, playerInfo.playerId);
    if (privateData) {
      socket.emit('game:privateData', privateData);
    }

    // Check if all quests selected
    if (gameServer.allQuestsSelected(room.id)) {
      roomManager.updateRoomStatus(room.code, 'playing');
      
      // Send initial game state to all
      const sanitizedState = gameServer.getSanitizedState(room.id);
      if (sanitizedState) {
        io.to(room.code).emit('game:stateUpdate', sanitizedState);
      }

      // Send private data to each player
      room.players.forEach(player => {
        const playerSocket = io.sockets.sockets.get(player.socketId);
        if (playerSocket) {
          const data = gameServer.getPrivateData(room.id, player.id);
          if (data) {
            playerSocket.emit('game:privateData', data);
          }
        }
      });
    }

    callback({ success: true });
  });

  // Draw Card
  socket.on('game:drawCard', (callback) => {
    const playerInfo = socketToPlayer.get(socket.id);
    if (!playerInfo) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }

    const room = roomManager.getRoom(playerInfo.roomCode);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const gameState = gameServer.getGameState(room.id);
    if (!gameState) {
      callback({ success: false, error: 'Game not found' });
      return;
    }

    // Validate action
    const validation = ActionValidator.validateDrawAction(gameState, playerInfo.playerId);
    if (!validation.valid) {
      callback({ success: false, error: validation.error });
      return;
    }

    const result = gameServer.drawCard(room.id, playerInfo.playerId);
    if (!result.success) {
      callback({ success: false, error: result.error });
      return;
    }

    // Send updated state to all
    broadcastGameState(room.code, room.id);

    // Send private data to drawing player
    const privateData = gameServer.getPrivateData(room.id, playerInfo.playerId);
    if (privateData) {
      socket.emit('game:privateData', privateData);
    }

    callback({ success: true });
  });

  // Play Card
  socket.on('game:playCard', (cardId, targetId, callback) => {
    const playerInfo = socketToPlayer.get(socket.id);
    if (!playerInfo) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }

    const room = roomManager.getRoom(playerInfo.roomCode);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const gameState = gameServer.getGameState(room.id);
    if (!gameState) {
      callback({ success: false, error: 'Game not found' });
      return;
    }

    // Validate action
    const validation = ActionValidator.validatePlayCard(gameState, playerInfo.playerId, cardId, targetId);
    if (!validation.valid) {
      callback({ success: false, error: validation.error });
      return;
    }

    const result = gameServer.playCard(room.id, playerInfo.playerId, cardId, targetId);
    
    // Broadcast action result
    io.to(room.code).emit('game:actionResult', result);

    // Broadcast updated state
    broadcastGameState(room.code, room.id);

    // Send private data to player
    const privateData = gameServer.getPrivateData(room.id, playerInfo.playerId);
    if (privateData) {
      socket.emit('game:privateData', privateData);
    }

    // Check game over
    const updatedState = gameServer.getSanitizedState(room.id);
    if (updatedState?.isGameOver && updatedState.winnerId) {
      const winner = gameState.players.find(p => p.id === updatedState.winnerId);
      io.to(room.code).emit('game:over', updatedState.winnerId, winner?.name || 'Unknown');
      roomManager.updateRoomStatus(room.code, 'finished');
    }

    callback({ success: true });
  });

  // Discard Card
  socket.on('game:discardCard', (cardId, callback) => {
    const playerInfo = socketToPlayer.get(socket.id);
    if (!playerInfo) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }

    const room = roomManager.getRoom(playerInfo.roomCode);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const gameState = gameServer.getGameState(room.id);
    if (!gameState) {
      callback({ success: false, error: 'Game not found' });
      return;
    }

    // Validate
    const validation = ActionValidator.validateDiscard(gameState, playerInfo.playerId, cardId);
    if (!validation.valid) {
      callback({ success: false, error: validation.error });
      return;
    }

    const success = gameServer.discardCard(room.id, playerInfo.playerId, cardId);
    if (!success) {
      callback({ success: false, error: 'Failed to discard' });
      return;
    }

    broadcastGameState(room.code, room.id);

    const privateData = gameServer.getPrivateData(room.id, playerInfo.playerId);
    if (privateData) {
      socket.emit('game:privateData', privateData);
    }

    callback({ success: true });
  });

  // End Turn
  socket.on('game:endTurn', (callback) => {
    const playerInfo = socketToPlayer.get(socket.id);
    if (!playerInfo) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }

    const room = roomManager.getRoom(playerInfo.roomCode);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const gameState = gameServer.getGameState(room.id);
    if (!gameState) {
      callback({ success: false, error: 'Game not found' });
      return;
    }

    const validation = ActionValidator.validateEndTurn(gameState, playerInfo.playerId);
    if (!validation.valid) {
      callback({ success: false, error: validation.error });
      return;
    }

    const success = gameServer.endTurn(room.id, playerInfo.playerId);
    if (!success) {
      callback({ success: false, error: 'Failed to end turn' });
      return;
    }

    broadcastGameState(room.code, room.id);
    callback({ success: true });
  });

  // Reconnection
  socket.on('reconnect:attempt', (roomCode, playerId, callback) => {
    const room = roomManager.reconnectPlayer(roomCode, playerId, socket.id);
    if (!room) {
      callback({ success: false, error: 'Could not reconnect' });
      return;
    }

    socketToPlayer.set(socket.id, { roomCode, playerId });
    socket.join(roomCode);

    const gameState = gameServer.getSanitizedState(room.id);
    const privateData = gameServer.getPrivateData(room.id, playerId);

    socket.to(roomCode).emit('player:reconnected', playerId);

    callback({
      success: true,
      room,
      gameState: gameState || undefined,
      privateData: privateData || undefined
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    handlePlayerDisconnect(socket);
  });
});

function handlePlayerLeave(socket: Socket) {
  const playerInfo = socketToPlayer.get(socket.id);
  if (!playerInfo) return;

  const { room, shouldClose } = roomManager.leaveRoom(playerInfo.roomCode, playerInfo.playerId);
  
  socket.leave(playerInfo.roomCode);
  socketToPlayer.delete(socket.id);

  if (shouldClose) {
    io.to(playerInfo.roomCode).emit('room:closed', 'Host left the room');
  } else if (room) {
    io.to(room.code).emit('room:playerLeft', playerInfo.playerId);
    io.to(room.code).emit('room:updated', room);
  }
}

function handlePlayerDisconnect(socket: Socket) {
  const playerInfo = socketToPlayer.get(socket.id);
  if (!playerInfo) return;

  const room = roomManager.getRoom(playerInfo.roomCode);
  if (!room) return;

  if (room.status === 'playing') {
    // Mark as disconnected but keep in game
    roomManager.disconnectPlayer(playerInfo.roomCode, playerInfo.playerId);
    socket.to(playerInfo.roomCode).emit('player:disconnected', playerInfo.playerId);
  } else {
    // Remove from waiting room
    handlePlayerLeave(socket);
  }

  socketToPlayer.delete(socket.id);
}

function broadcastGameState(roomCode: string, roomId: string) {
  const sanitizedState = gameServer.getSanitizedState(roomId);
  if (sanitizedState) {
    io.to(roomCode).emit('game:stateUpdate', sanitizedState);
  }
}

httpServer.listen(PORT, () => {
  console.log(`🎮 Hidden Quest Server running on port ${PORT}`);
  console.log(`📡 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
