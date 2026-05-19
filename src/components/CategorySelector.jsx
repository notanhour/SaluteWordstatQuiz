import React from 'react';

export const CategorySelector = ({ categories, currentCategoryId, onSelectCategory }) => {
  return (
    <section className="category-selector">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`category-button ${category.id === currentCategoryId ? 'active' : ''}`}
          type="button"
          onClick={() => onSelectCategory(category.id)}
        >
          {category.title}
        </button>
      ))}
    </section>
  );
};
