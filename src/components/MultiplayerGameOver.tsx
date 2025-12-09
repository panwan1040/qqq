import React from 'react';
import { useMultiplayerStore } from '../stores/multiplayerStore';

export const MultiplayerGameOver: React.FC = () => {
  const { gameState, playerId, room, reset } = useMultiplayerStore();

  if (!gameState) return null;

  const winner = gameState.players.find(p => p.id === gameState.winnerId);
  const isWinner = gameState.winnerId === playerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Trophy/Skull Icon */}
        <div className="text-8xl mb-6 animate-bounce">
          {isWinner ? '🏆' : '💀'}
        </div>

        {/* Result Text */}
        <h1 className={`text-4xl font-bold mb-4 ${
          isWinner 
            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-transparent bg-clip-text' 
            : 'text-slate-400'
        }`}>
          {isWinner ? 'Victory!' : 'Game Over'}
        </h1>

        {/* Winner Info */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-6">
          <p className="text-slate-400 mb-2">Winner</p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-3xl font-bold text-white">
              {winner?.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-white">{winner?.name}</p>
              <p className="text-purple-400">{winner?.characterName}</p>
            </div>
          </div>
        </div>

        {/* Final Standings */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50 mb-6">
          <h3 className="text-slate-400 text-sm mb-3">Final Standings</h3>
          <div className="space-y-2">
            {gameState.players
              .sort((a, b) => (b.isAlive ? 1 : 0) - (a.isAlive ? 1 : 0))
              .map((player, index) => (
                <div 
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    player.id === gameState.winnerId 
                      ? 'bg-yellow-500/20 border border-yellow-500/50' 
                      : 'bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-6">{index + 1}.</span>
                    <span className={player.isAlive ? 'text-white' : 'text-slate-500'}>
                      {player.name}
                    </span>
                    {player.id === playerId && (
                      <span className="text-purple-400 text-xs">(You)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {player.id === gameState.winnerId && <span>👑</span>}
                    {!player.isAlive && <span>💀</span>}
                    <span className={player.isAlive ? 'text-green-400' : 'text-red-400'}>
                      {player.hp} HP
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={reset}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition"
        >
          Back to Lobby
        </button>

        {/* Room Code */}
        <p className="text-slate-500 text-sm mt-4">
          Room: {room?.code}
        </p>
      </div>
    </div>
  );
};
