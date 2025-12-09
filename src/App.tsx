import React from 'react';
import { useGameStore } from './stores/gameStore';
import { SetupScreen } from './components/SetupScreen';
import { QuestSelectionScreen } from './components/QuestSelectionScreen';
import { GameBoard } from './components/GameBoard';
import { GameOverScreen } from './components/GameOverScreen';

function App() {
    const gamePhase = useGameStore(state => state.gamePhase);

    return (
        <>
            {gamePhase === 'setup' && <SetupScreen />}
            {gamePhase === 'quest_selection' && <QuestSelectionScreen />}
            {gamePhase === 'playing' && <GameBoard />}
            {gamePhase === 'game_over' && <GameOverScreen />}
        </>
    );
}

export default App;
