import React from 'react';
import { Card, CardType } from '../models/Card';

interface CardDisplayProps {
    card: Card;
    isSelected?: boolean;
    isPlayable?: boolean;
    onClick?: () => void;
    size?: 'small' | 'medium' | 'large';
    showBack?: boolean;
}

const cardTypeColors: Record<CardType, { bg: string; border: string; text: string }> = {
    [CardType.CHARACTER]: { bg: 'from-indigo-600 to-purple-600', border: 'border-indigo-400', text: 'text-indigo-200' },
    [CardType.QUEST]: { bg: 'from-amber-600 to-orange-600', border: 'border-amber-400', text: 'text-amber-200' },
    [CardType.ATTACK]: { bg: 'from-red-600 to-rose-600', border: 'border-red-400', text: 'text-red-200' },
    [CardType.HEAL]: { bg: 'from-emerald-600 to-green-600', border: 'border-emerald-400', text: 'text-emerald-200' },
    [CardType.ARMOR]: { bg: 'from-slate-500 to-slate-600', border: 'border-slate-400', text: 'text-slate-200' },
    [CardType.BUFF]: { bg: 'from-yellow-500 to-amber-500', border: 'border-yellow-400', text: 'text-yellow-200' },
    [CardType.SPELL]: { bg: 'from-violet-600 to-purple-600', border: 'border-violet-400', text: 'text-violet-200' },
    [CardType.TRAP]: { bg: 'from-orange-600 to-red-600', border: 'border-orange-400', text: 'text-orange-200' },
    [CardType.RARE]: { bg: 'from-pink-500 to-rose-500', border: 'border-pink-400', text: 'text-pink-200' }
};

const cardTypeIcons: Record<CardType, string> = {
    [CardType.CHARACTER]: '👤',
    [CardType.QUEST]: '📜',
    [CardType.ATTACK]: '⚔️',
    [CardType.HEAL]: '💚',
    [CardType.ARMOR]: '🛡️',
    [CardType.BUFF]: '✨',
    [CardType.SPELL]: '🔮',
    [CardType.TRAP]: '⚡',
    [CardType.RARE]: '💎'
};

const sizeClasses = {
    small: 'w-24 h-36 text-xs',
    medium: 'w-32 h-48 text-sm',
    large: 'w-40 h-56 text-base'
};

export const CardDisplay: React.FC<CardDisplayProps> = ({
    card,
    isSelected = false,
    isPlayable = true,
    onClick,
    size = 'medium',
    showBack = false
}) => {
    const colors = cardTypeColors[card.type];
    const icon = cardTypeIcons[card.type];

    if (showBack) {
        return (
            <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-500/50 flex items-center justify-center`}>
                <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center">
                    <span className="text-2xl">🎴</span>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={isPlayable ? onClick : undefined}
            className={`
        ${sizeClasses[size]} 
        relative rounded-xl overflow-hidden
        bg-gradient-to-br ${colors.bg}
        border-2 ${isSelected ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' : colors.border}
        transition-all duration-200
        ${isPlayable ? 'cursor-pointer hover:scale-105 hover:-translate-y-1' : 'opacity-70 cursor-not-allowed'}
        ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900' : ''}
      `}
        >
            {/* Card Header */}
            <div className="absolute top-0 left-0 right-0 p-2 bg-black/30">
                <div className="flex items-center gap-1">
                    <span className="text-lg">{icon}</span>
                    <span className={`font-bold truncate ${colors.text}`}>{card.name}</span>
                </div>
            </div>

            {/* Card Value (for action cards) */}
            {'value' in card && (
                <div className="absolute top-2 right-2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{card.value}</span>
                </div>
            )}

            {/* Card Center */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl opacity-30">{icon}</span>
            </div>

            {/* Card Description */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50">
                <p className="text-white/90 text-center line-clamp-2 leading-tight">
                    {card.description}
                </p>
            </div>

            {/* Type Badge */}
            <div className={`absolute top-10 left-2 px-2 py-0.5 rounded-full bg-black/30 ${colors.text} text-[10px] uppercase tracking-wider`}>
                {card.type}
            </div>

            {/* Selected Glow */}
            {isSelected && (
                <div className="absolute inset-0 bg-yellow-400/10 animate-pulse" />
            )}
        </div>
    );
};
