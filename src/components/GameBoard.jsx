import React from 'react';

export const GameBoard = ({ currentPair, answerState, selectedSide, onAnswer }) => {
  if (!currentPair) {
    return <div className="game-message">Данные не загружены</div>;
  }

  const correctSide =
    currentPair.left_count === currentPair.right_count
      ? null
      : currentPair.left_count > currentPair.right_count
      ? 'left'
      : 'right';

  const getCardClass = (side) => {
    let className = `query-card ${side}`;

    if (answerState === 'correct' && correctSide === side) {
      className += ' correct';
    }
    if (answerState === 'wrong' && selectedSide === side) {
      className += ' wrong';
    }

    return className;
  };

  return (
    <section className="cards-grid">
      <button className={getCardClass('left')} type="button" onClick={() => onAnswer('left')}>
        <span className="card-query">{currentPair.left}</span>
      </button>

      <button className={getCardClass('right')} type="button" onClick={() => onAnswer('right')}>
        <span className="card-query">{currentPair.right}</span>
      </button>
    </section>
  );
};
