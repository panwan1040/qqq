import React, { useState, useEffect } from 'react';

interface DiceRollerProps {
    value: number | null;
    outcome: 'miss' | 'hit' | 'critical' | null;
    isRolling: boolean;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ value, outcome, isRolling }) => {
    const [displayValue, setDisplayValue] = useState<number>(1);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (isRolling) {
            setAnimating(true);
            // Animate through random values
            const interval = setInterval(() => {
                setDisplayValue(Math.floor(Math.random() * 8) + 1);
            }, 50);

            // Stop after 1 second
            setTimeout(() => {
                clearInterval(interval);
                setAnimating(false);
                if (value) setDisplayValue(value);
            }, 1000);

            return () => clearInterval(interval);
        } else if (value) {
            setDisplayValue(value);
        }
    }, [isRolling, value]);

    const getOutcomeStyle = () => {
        switch (outcome) {
            case 'critical':
                return 'from-yellow-400 to-amber-500 text-yellow-900 animate-pulse shadow-lg shadow-yellow-500/50';
            case 'miss':
                return 'from-slate-500 to-slate-600 text-slate-300';
            case 'hit':
                return 'from-red-500 to-rose-500 text-white';
            default:
                return 'from-purple-500 to-indigo-500 text-white';
        }
    };

    const getOutcomeLabel = () => {
        switch (outcome) {
            case 'critical':
                return '⚡ CRITICAL! ⚡';
            case 'miss':
                return '💨 Miss';
            case 'hit':
                return '✓ Hit!';
            default:
                return '';
        }
    };

    if (!value && !isRolling) return null;

    return (
        <div className="flex flex-col items-center gap-2">
            {/* D8 Dice */}
            <div
                className={`
          w-24 h-24 rounded-xl flex items-center justify-center
          bg-gradient-to-br ${getOutcomeStyle()}
          transform transition-all duration-300
          ${animating ? 'animate-bounce scale-110 rotate-12' : ''}
        `}
            >
                <span className="text-4xl font-bold">{displayValue}</span>
            </div>

            {/* D8 Label */}
            <div className="text-slate-400 text-sm">D8 Roll</div>

            {/* Outcome */}
            {outcome && !animating && (
                <div className={`
          px-4 py-2 rounded-full font-bold text-lg
          ${outcome === 'critical' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' : ''}
          ${outcome === 'miss' ? 'bg-slate-500/20 text-slate-400' : ''}
          ${outcome === 'hit' ? 'bg-red-500/20 text-red-400' : ''}
        `}>
                    {getOutcomeLabel()}
                </div>
            )}

            {/* Miss/Hit Range Indicator */}
            <div className="flex gap-1 text-xs text-slate-500">
                <span className="px-2 py-0.5 bg-slate-700 rounded">1-2 Miss</span>
                <span className="px-2 py-0.5 bg-red-900/50 rounded">3-7 Hit</span>
                <span className="px-2 py-0.5 bg-yellow-900/50 rounded">8 Crit</span>
            </div>
        </div>
    );
};
