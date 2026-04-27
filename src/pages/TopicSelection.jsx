import React from 'react';
import { CategorySelector } from '../components/CategorySelector';

export const TopicSelection = ({ categories, onSelectCategory }) => {
  return (
    <main className="topic-container">
      <header className="topic-header">
        <div className="topic-title">Выберите тему</div>
        <div className="topic-subtitle">Начните игру, выбрав категорию</div>
      </header>

      <CategorySelector categories={categories} currentCategoryId={null} onSelectCategory={onSelectCategory} />
    </main>
  );
};
