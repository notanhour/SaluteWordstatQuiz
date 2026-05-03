import React from 'react';

export const ResultPanel = ({ currentPair, answerState, selectedSide, onNext }) => {
  if (!currentPair) {
    return null;
  }

  const leftPercent = currentPair.left_percent;
  const rightPercent = 100 - leftPercent;

  return (
    <section className="result-panel">
      <div className="progress-bar" aria-label="Соотношение популярности">
        <div className="progress-fill left-fill" style={{ width: `${leftPercent}%` }}>
          <span className="progress-text">{leftPercent}%</span>
        </div>
        <div className="progress-fill right-fill" style={{ width: `${rightPercent}%` }}>
          <span className="progress-text">{rightPercent}%</span>
        </div>
      </div>
    </section>
  );
};
