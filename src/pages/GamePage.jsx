import React from 'react';
import { GameBoard } from '../components/GameBoard';
import { ResultPanel } from '../components/ResultPanel';

export const GamePage = (props) => {
  const { categoryTitle, currentPair, score, answerState, selectedSide, onAnswer, onNext, onBack } = props;

  return (
    <main className="game-container">
      <header className="game-header">
        <button className="back-button" type="button" onClick={onBack}>
          ← Назад
        </button>
        <div className="score-badge">Счет: {score}</div>
      </header>

      <div className="category-title">{categoryTitle}</div>

      <GameBoard currentPair={currentPair} answerState={answerState} selectedSide={selectedSide} onAnswer={onAnswer} />

      {answerState !== 'idle' && (
        <ResultPanel currentPair={currentPair} answerState={answerState} selectedSide={selectedSide} onNext={onNext} />
      )}
    </main>
  );
};
