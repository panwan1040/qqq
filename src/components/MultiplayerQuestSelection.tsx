import React from 'react';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { Quest } from '../network/types';

export const MultiplayerQuestSelection: React.FC = () => {
  const { questOptions, room, playerId, selectQuest, privateData } = useMultiplayerStore();

  // If quest already selected, show waiting screen
  if (privateData?.quest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Quest Selected!</h2>
          <p className="text-slate-400">Waiting for other players...</p>
          
          {/* Show selected quest */}
          <div className="mt-6 p-4 bg-slate-800/80 rounded-xl border border-purple-500/50 max-w-sm mx-auto">
            <h3 className="text-purple-400 font-semibold">{privateData.quest.name}</h3>
            <p className="text-slate-300 text-sm mt-1">{privateData.quest.description}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSelect = async (quest: Quest) => {
    await selectQuest(quest.id);
  };

  const currentPlayer = room?.players.find(p => p.id === playerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text mb-2">
            Choose Your Secret Quest
          </h1>
          <p className="text-slate-400">
            {currentPlayer?.name}, select one quest. Keep it secret from other players!
          </p>
        </div>

        {/* Quest Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {questOptions.map((quest) => (
            <button
              key={quest.id}
              onClick={() => handleSelect(quest)}
              className="group relative bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 text-left"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition" />
              
              <div className="relative">
                {/* Quest Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl mb-4">
                  {quest.type === 'kill' && '⚔️'}
                  {quest.type === 'survive' && '🛡️'}
                  {quest.type === 'draw' && '🃏'}
                  {quest.type === 'heal' && '💚'}
                  {quest.type === 'spell' && '✨'}
                </div>

                {/* Quest Info */}
                <h3 className="text-xl font-bold text-white mb-2">{quest.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{quest.description}</p>

                {/* Target */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Target:</span>
                  <span className="text-purple-400 font-semibold">{quest.target}</span>
                </div>
              </div>

              {/* Select indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition">
                <span className="text-purple-400 text-sm">Click to select →</span>
              </div>
            </button>
          ))}
        </div>

        {/* Warning */}
        <div className="mt-8 text-center">
          <p className="text-yellow-500/80 text-sm">
            ⚠️ Your quest is secret! Don't let others see your screen.
          </p>
        </div>
      </div>
    </div>
  );
};
