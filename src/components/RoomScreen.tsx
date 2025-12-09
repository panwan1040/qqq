import React, { useState } from 'react';
import { useMultiplayerStore } from '../stores/multiplayerStore';

export const RoomScreen: React.FC = () => {
  const { 
    room, 
    playerId, 
    isHost, 
    errorMessage,
    leaveRoom, 
    setReady, 
    startGame,
    clearError 
  } = useMultiplayerStore();

  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const currentPlayer = room.players.find(p => p.id === playerId);
  const allReady = room.players.every(p => p.isReady);
  const canStart = isHost && allReady && room.players.length >= 4;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    await startGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Waiting Room</h1>
          
          {/* Room Code */}
          <div 
            onClick={copyRoomCode}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-700 transition"
          >
            <span className="text-slate-400 text-sm">Room Code:</span>
            <span className="text-3xl font-mono font-bold text-purple-400 tracking-widest">
              {room.code}
            </span>
            <span className="text-slate-500 text-sm">
              {copied ? '✓ Copied!' : '📋'}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm flex justify-between items-center">
            <span>{errorMessage}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-300">✕</button>
          </div>
        )}

        {/* Players List */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Players</h2>
            <span className="text-slate-400">{room.players.length}/{room.maxPlayers}</span>
          </div>

          <div className="space-y-3">
            {room.players.map((player) => (
              <div 
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  player.id === playerId 
                    ? 'bg-purple-500/20 border border-purple-500/50' 
                    : 'bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    player.isConnected ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-slate-600'
                  }`}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{player.name}</span>
                      {player.isHost && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          Host
                        </span>
                      )}
                      {player.id === playerId && (
                        <span className="text-purple-400 text-xs">(You)</span>
                      )}
                    </div>
                    {!player.isConnected && (
                      <span className="text-red-400 text-xs">Disconnected</span>
                    )}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  player.isReady 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-slate-600 text-slate-400'
                }`}>
                  {player.isReady ? '✓ Ready' : 'Not Ready'}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center justify-center p-3 rounded-xl bg-slate-700/30 border border-dashed border-slate-600">
                <span className="text-slate-500">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!isHost && currentPlayer && (
            <button
              onClick={() => setReady(!currentPlayer.isReady)}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition ${
                currentPlayer.isReady
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90'
              }`}
            >
              {currentPlayer.isReady ? 'Cancel Ready' : "I'm Ready!"}
            </button>
          )}

          {isHost && (
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {room.players.length < 4 
                ? `Need ${4 - room.players.length} more players`
                : !allReady 
                  ? 'Waiting for players...'
                  : '🎮 Start Game'
              }
            </button>
          )}

          <button
            onClick={leaveRoom}
            className="w-full py-3 text-slate-400 hover:text-red-400 transition"
          >
            Leave Room
          </button>
        </div>

        {/* Info */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Share the room code with your friends to join!
        </p>
      </div>
    </div>
  );
};
