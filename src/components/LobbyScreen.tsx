import React, { useState, useEffect } from 'react';
import { useMultiplayerStore } from '../stores/multiplayerStore';

export const LobbyScreen: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const { 
    isConnected, 
    isConnecting, 
    connectionError,
    errorMessage,
    connect, 
    createRoom, 
    joinRoom,
    clearError 
  } = useMultiplayerStore();

  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect();
    }
  }, []);

  const handleCreate = async () => {
    if (!playerName.trim()) return;
    await createRoom(playerName.trim());
  };

  const handleJoin = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    await joinRoom(roomCode.trim(), playerName.trim());
  };

  const error = connectionError || errorMessage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text mb-2">
            Hidden Quest
          </h1>
          <p className="text-slate-400">Multiplayer Card Game</p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-slate-400">
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-300">✕</button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
          {mode === 'menu' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('create')}
                disabled={!isConnected}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎮 Create Room
              </button>
              <button
                onClick={() => setMode('join')}
                disabled={!isConnected}
                className="w-full py-4 bg-slate-700 text-white rounded-xl font-semibold text-lg hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚪 Join Room
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white text-center mb-4">Create New Room</h2>
              <input
                type="text"
                placeholder="Your Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleCreate}
                disabled={!playerName.trim() || !isConnected}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Room
              </button>
              <button
                onClick={() => setMode('menu')}
                className="w-full py-3 text-slate-400 hover:text-white transition"
              >
                ← Back
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white text-center mb-4">Join Room</h2>
              <input
                type="text"
                placeholder="Your Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 text-center text-2xl tracking-widest font-mono"
              />
              <button
                onClick={handleJoin}
                disabled={!playerName.trim() || roomCode.length !== 6 || !isConnected}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
              <button
                onClick={() => setMode('menu')}
                className="w-full py-3 text-slate-400 hover:text-white transition"
              >
                ← Back
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          4-6 Players • Secret Quests • Strategic Combat
        </p>
      </div>
    </div>
  );
};
