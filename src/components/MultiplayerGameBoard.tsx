import React from 'react';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { SanitizedPlayer, Card } from '../network/types';

// Player position around the board (for 4-6 players)
const getPlayerPositions = (count: number, myIndex: number) => {
  // Positions: top-left, top-right, left, right, bottom-left, bottom-right
  const positions = [
    { area: 'top-left', className: 'col-start-1 row-start-1' },
    { area: 'top-right', className: 'col-start-3 row-start-1' },
    { area: 'left', className: 'col-start-1 row-start-2' },
    { area: 'right', className: 'col-start-3 row-start-2' },
    { area: 'bottom-left', className: 'col-start-1 row-start-3' },
    { area: 'bottom-right', className: 'col-start-3 row-start-3' },
  ];
  
  // Reorder so current player's opponents are visible
  const reordered = [];
  for (let i = 0; i < count; i++) {
    if (i !== myIndex) {
      reordered.push(i);
    }
  }
  
  return reordered.map((playerIdx, posIdx) => ({
    playerIndex: playerIdx,
    ...positions[posIdx]
  }));
};

// Opponent Card Component
const OpponentCard: React.FC<{
  player: SanitizedPlayer;
  isCurrentTurn: boolean;
  isTargetable: boolean;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ player, isCurrentTurn, isTargetable, isSelected, onSelect }) => {
  const hpPercent = (player.hp / player.maxHp) * 100;

  return (
    <div
      onClick={isTargetable ? onSelect : undefined}
      className={`
        relative bg-slate-800/90 rounded-xl p-3 border transition-all
        ${isCurrentTurn ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : 'border-slate-700/50'}
        ${isTargetable ? 'cursor-pointer hover:border-red-500 hover:scale-105' : ''}
        ${isSelected ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/30' : ''}
        ${!player.isAlive ? 'opacity-50 grayscale' : ''}
      `}
    >
      {/* Current Turn Indicator */}
      {isCurrentTurn && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-500 rounded-full text-xs text-black font-bold">
          Turn
        </div>
      )}

      {/* Death Overlay */}
      {!player.isAlive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-10">
          <span className="text-3xl">💀</span>
        </div>
      )}

      {/* Player Avatar & Name */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium text-sm truncate">{player.name}</div>
          <div className="text-purple-400 text-xs truncate">{player.characterName || 'Unknown'}</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-3 mb-2">
        {/* HP */}
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-400">HP</span>
            <span className="text-white">{player.hp}/{player.maxHp}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Icons */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-orange-400">
          <span>⚔️</span>
          <span>{player.atk}</span>
        </div>
        <div className="flex items-center gap-1 text-blue-400">
          <span>🛡️</span>
          <span>{player.armor}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span>🃏</span>
          <span>{player.handCount}</span>
        </div>
      </div>

      {/* Passive Indicator */}
      <div className="mt-2 px-2 py-1 bg-slate-900/50 rounded text-xs text-purple-400 truncate">
        Passive
      </div>

      {/* Quest Progress */}
      {player.hasQuest && (
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Quest</span>
            <span className="text-purple-400">{player.questProgress}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${player.questProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Buffs */}
      {player.buffs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {player.buffs.map(buff => (
            <span key={buff.id} className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
              ✨ {buff.duration}
            </span>
          ))}
        </div>
      )}

      {/* Target Indicator */}
      {isTargetable && (
        <div className="absolute inset-0 border-2 border-red-500/50 rounded-xl pointer-events-none animate-pulse" />
      )}
    </div>
  );
};

// Hand Card Component
const HandCard: React.FC<{
  card: Card;
  isSelected: boolean;
  canPlay: boolean;
  onSelect: () => void;
  onDiscard: () => void;
}> = ({ card, isSelected, canPlay, onSelect, onDiscard }) => {
  const getCardColor = () => {
    switch (card.type) {
      case 'attack': return 'from-red-500 to-orange-500';
      case 'heal': return 'from-green-500 to-emerald-500';
      case 'buff': return 'from-blue-500 to-cyan-500';
      case 'spell': return 'from-purple-500 to-pink-500';
      case 'trap': return 'from-yellow-500 to-amber-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getCardIcon = () => {
    switch (card.type) {
      case 'attack': return '⚔️';
      case 'heal': return '💚';
      case 'buff': return '⬆️';
      case 'spell': return '✨';
      case 'trap': return '🪤';
      default: return '🃏';
    }
  };

  return (
    <div
      onClick={canPlay ? onSelect : undefined}
      className={`
        relative w-24 h-36 rounded-xl transition-all cursor-pointer
        ${isSelected ? 'scale-110 -translate-y-4 z-10' : 'hover:scale-105 hover:-translate-y-2'}
        ${canPlay ? '' : 'opacity-60'}
      `}
    >
      {/* Card Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getCardColor()} rounded-xl shadow-lg`} />
      
      {/* Card Content */}
      <div className="relative h-full p-2 flex flex-col">
        {/* Icon */}
        <div className="text-2xl text-center">{getCardIcon()}</div>
        
        {/* Name */}
        <div className="flex-1 flex items-center justify-center">
          <span className="text-white text-xs font-semibold text-center leading-tight">
            {card.name}
          </span>
        </div>

        {/* Stats */}
        <div className="text-center text-white/80 text-xs">
          {card.damage && `DMG: ${card.damage}`}
          {card.healAmount && `+${card.healAmount} HP`}
        </div>
      </div>

      {/* Selection Ring */}
      {isSelected && (
        <div className="absolute inset-0 ring-2 ring-white rounded-xl" />
      )}

      {/* Discard Button (shown on hover) */}
      <button
        onClick={(e) => { e.stopPropagation(); onDiscard(); }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs opacity-0 hover:opacity-100 transition flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  );
};

export const MultiplayerGameBoard: React.FC = () => {
  const {
    gameState,
    privateData,
    playerId,
    room,
    selectedCardId,
    selectedTargetId,
    lastActionResult,
    selectCard,
    selectTarget,
    playCard,
    discardCard,
    drawCard,
    endTurn
  } = useMultiplayerStore();

  if (!gameState || !room) return null;

  const myIndex = gameState.players.findIndex(p => p.id === playerId);
  const myPlayer = gameState.players[myIndex];
  const isMyTurn = gameState.currentPlayerId === playerId;
  const opponentPositions = getPlayerPositions(gameState.players.length, myIndex);

  // Check if selected card needs a target
  const selectedCard = privateData?.hand.find(c => c.id === selectedCardId);
  const needsTarget = selectedCard?.type === 'attack';

  const handleTargetSelect = async (targetId: string) => {
    if (!needsTarget) return;
    selectTarget(targetId);
    // Auto-play after selecting target
    setTimeout(() => playCard(), 100);
  };

  const handleCardSelect = (cardId: string) => {
    if (selectedCardId === cardId) {
      // Deselect
      selectCard(null);
      selectTarget(null);
    } else {
      selectCard(cardId);
      // If card doesn't need target, play immediately
      const card = privateData?.hand.find(c => c.id === cardId);
      if (card && card.type !== 'attack') {
        setTimeout(() => playCard(), 100);
      }
    }
  };

  const needsDiscard = (privateData?.hand.length || 0) > 7;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
            Hidden Quest
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Room: {room.code}</span>
            <span className="text-slate-400 text-sm">Turn {gameState.turnNumber}</span>
            <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-300 text-xs">
              {gameState.turnPhase}
            </span>
          </div>
        </div>
      </div>

      {/* Action Result Toast */}
      {lastActionResult && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-4 py-2 bg-slate-800 border border-purple-500/50 rounded-lg shadow-xl">
            <p className="text-white text-sm">{lastActionResult.message}</p>
            {lastActionResult.diceRoll && (
              <p className="text-purple-400 text-xs">🎲 Rolled: {lastActionResult.diceRoll}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Game Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-3 grid-rows-3 gap-4" style={{ minHeight: '70vh' }}>
        {/* Opponents around the board */}
        {opponentPositions.map(({ playerIndex, className }) => {
          const player = gameState.players[playerIndex];
          if (!player) return null;
          
          return (
            <div key={player.id} className={className}>
              <OpponentCard
                player={player}
                isCurrentTurn={gameState.currentPlayerId === player.id}
                isTargetable={isMyTurn && needsTarget && player.isAlive && player.id !== playerId}
                isSelected={selectedTargetId === player.id}
                onSelect={() => handleTargetSelect(player.id)}
              />
            </div>
          );
        })}

        {/* Center Area - Deck & Discard */}
        <div className="col-start-2 row-start-2 flex items-center justify-center gap-6">
          {/* Draw Deck */}
          <div className="text-center">
            <div className="w-20 h-28 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg flex items-center justify-center border-2 border-indigo-400/50">
              <span className="text-white font-bold">{gameState.drawDeckCount}</span>
            </div>
            <span className="text-slate-400 text-xs mt-1 block">Deck</span>
          </div>

          {/* Discard Pile */}
          <div className="text-center">
            <div className="w-20 h-28 bg-slate-700 rounded-xl shadow-lg flex items-center justify-center border-2 border-slate-600">
              <span className="text-slate-400 font-bold">{gameState.discardPileCount}</span>
            </div>
            <span className="text-slate-400 text-xs mt-1 block">Discard</span>
          </div>

          {/* Active Trap Indicator */}
          {gameState.hasActiveTrap && (
            <div className="absolute">
              <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 text-xs animate-pulse">
                🪤 Trap Active!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - My Player Area */}
      <div className="max-w-7xl mx-auto mt-4">
        {/* My Status Bar */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-purple-500/50 mb-4">
          <div className="flex items-center justify-between">
            {/* My Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                {myPlayer?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold">{myPlayer?.name}</div>
                <div className="text-purple-400 text-sm">{myPlayer?.characterName}</div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 ml-4">
                <div className="text-center">
                  <div className="text-red-400 text-lg font-bold">{myPlayer?.hp}/{myPlayer?.maxHp}</div>
                  <div className="text-slate-500 text-xs">HP</div>
                </div>
                <div className="text-center">
                  <div className="text-orange-400 text-lg font-bold">{myPlayer?.atk}</div>
                  <div className="text-slate-500 text-xs">ATK</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 text-lg font-bold">{myPlayer?.armor}</div>
                  <div className="text-slate-500 text-xs">Armor</div>
                </div>
              </div>
            </div>

            {/* Quest Progress */}
            {privateData?.quest && (
              <div className="bg-slate-900/50 rounded-lg p-3 min-w-[200px]">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-purple-400 font-medium">{privateData.quest.name}</span>
                  <span className="text-white">
                    {privateData.questProgress?.current}/{privateData.questProgress?.target}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ 
                      width: `${((privateData.questProgress?.current || 0) / (privateData.questProgress?.target || 1)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}

            {/* Turn Actions */}
            <div className="flex items-center gap-2">
              {isMyTurn && gameState.turnPhase === 'draw' && (
                <button
                  onClick={drawCard}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition"
                >
                  🃏 Draw Card
                </button>
              )}
              {isMyTurn && !needsDiscard && (
                <button
                  onClick={endTurn}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition"
                >
                  End Turn →
                </button>
              )}
            </div>
          </div>

          {/* Turn Status */}
          <div className="mt-3 text-center text-sm">
            {isMyTurn ? (
              <span className="text-green-400">
                {gameState.turnPhase === 'draw' && '🎴 Draw a card to begin your turn'}
                {gameState.turnPhase === 'action' && !selectedCardId && '🃏 Select a card from your hand to play'}
                {gameState.turnPhase === 'action' && selectedCardId && needsTarget && '🎯 Select an opponent to attack'}
                {needsDiscard && '⚠️ Hand limit exceeded! Discard cards'}
              </span>
            ) : (
              <span className="text-slate-400">
                Waiting for {gameState.players.find(p => p.id === gameState.currentPlayerId)?.name}'s turn...
              </span>
            )}
          </div>
        </div>

        {/* My Hand */}
        <div className="flex justify-center gap-2 pb-4 overflow-x-auto">
          {privateData?.hand.map((card) => (
            <HandCard
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id}
              canPlay={isMyTurn && gameState.turnPhase === 'action'}
              onSelect={() => handleCardSelect(card.id)}
              onDiscard={() => discardCard(card.id)}
            />
          ))}
          {(!privateData?.hand || privateData.hand.length === 0) && (
            <div className="text-slate-500 py-8">No cards in hand</div>
          )}
        </div>
      </div>
    </div>
  );
};
