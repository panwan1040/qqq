import React from 'react';
import { useMultiplayerStore } from './stores/multiplayerStore';
import { LobbyScreen } from './components/LobbyScreen';
import { RoomScreen } from './components/RoomScreen';
import { MultiplayerQuestSelection } from './components/MultiplayerQuestSelection';
import { MultiplayerGameBoard } from './components/MultiplayerGameBoard';
import { MultiplayerGameOver } from './components/MultiplayerGameOver';

function MultiplayerApp() {
  const gamePhase = useMultiplayerStore(state => state.gamePhase);

  return (
    <>
      {gamePhase === 'lobby' && <LobbyScreen />}
      {gamePhase === 'room' && <RoomScreen />}
      {gamePhase === 'quest_selection' && <MultiplayerQuestSelection />}
      {gamePhase === 'playing' && <MultiplayerGameBoard />}
      {gamePhase === 'game_over' && <MultiplayerGameOver />}
    </>
  );
}

export default MultiplayerApp;
