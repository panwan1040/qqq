import React from 'react';
import { Player } from '../models/Player';

interface PlayerStatusProps {
    player: Player;
    isCurrentPlayer: boolean;
    isTargetable: boolean;
    isSelected: boolean;
    onSelect?: () => void;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({
    player,
    isCurrentPlayer,
    isTargetable,
    isSelected,
    onSelect
}) => {
    const hpPercentage = (player.hp / player.maxHp) * 100;

    const getHpColor = () => {
        if (hpPercentage > 60) return 'from-green-500 to-emerald-500';
        if (hpPercentage > 30) return 'from-yellow-500 to-amber-500';
        return 'from-red-500 to-rose-500';
    };

    return (
        <div
            onClick={isTargetable ? onSelect : undefined}
            className={`
        relative rounded-xl p-4 transition-all duration-200
        ${player.isAlive ? 'bg-slate-800/80' : 'bg-slate-900/50 opacity-60'}
        ${isCurrentPlayer ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' : 'border border-slate-700/50'}
        ${isTargetable ? 'cursor-pointer hover:border-red-500/50 hover:bg-slate-700/80' : ''}
        ${isSelected ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/30' : ''}
      `}
        >
            {/* Current Player Indicator */}
            {isCurrentPlayer && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 rounded-full text-white text-xs font-medium">
                    Your Turn
                </div>
            )}

            {/* Death Overlay */}
            {!player.isAlive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                    <span className="text-4xl">💀</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${player.isAlive ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-slate-700'
                    }`}>
                    {player.character?.name.charAt(0) || '?'}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{player.name}</h3>
                    {player.character && (
                        <p className="text-purple-400 text-sm truncate">{player.character.name}</p>
                    )}
                </div>
            </div>

            {/* HP Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">HP</span>
                    <span className="text-white font-mono">{player.hp}/{player.maxHp}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r ${getHpColor()} transition-all duration-500`}
                        style={{ width: `${hpPercentage}%` }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                    <span className="text-2xl">⚔️</span>
                    <span className="text-white font-medium">{player.atk}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-2xl">🛡️</span>
                    <span className="text-white font-medium">{player.armor}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-2xl">🃏</span>
                    <span className="text-white font-medium">{player.hand.length}</span>
                </div>
            </div>

            {/* Buffs */}
            {player.buffs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                    {player.buffs.map(buff => (
                        <span
                            key={buff.id}
                            className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-300 text-xs"
                            title={`${buff.name} (${buff.duration} turns)`}
                        >
                            ✨ {buff.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Passive Ability */}
            {player.character && (
                <div className="mt-3 p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-purple-400 font-medium">{player.character.passiveAbility.name}</p>
                    <p className="text-xs text-slate-500">{player.character.passiveAbility.description}</p>
                </div>
            )}

            {/* Target Indicator */}
            {isTargetable && (
                <div className="absolute inset-0 border-2 border-red-500/50 rounded-xl pointer-events-none animate-pulse" />
            )}
        </div>
    );
};
