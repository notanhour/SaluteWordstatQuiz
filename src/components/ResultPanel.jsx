import React from 'react';

export const ResultPanel = ({ currentPair, answerState, selectedSide, onNext }) => {
  if (!currentPair) {
    return null;
  }

  const total = currentPair.left_count + currentPair.right_count;
  const leftPercent = total ? Math.round((currentPair.left_count / total) * 100) : 50;
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

      {/*
      <div className="stats-row">
        <div className="stat-cell">
          <div className="stat-label">{currentPair.left}</div>
          <div className="stat-value">{currentPair.left_count.toLocaleString()}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">{currentPair.right}</div>
          <div className="stat-value">{currentPair.right_count.toLocaleString()}</div>
        </div>
      </div>
      */}

    </section>
  );
};
