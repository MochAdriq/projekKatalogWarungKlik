import React from "react";

export function CategoryPills({
  categories = [],
  activeCategoryId = "",
  onSelectCategory,
  totalProductCount = 0,
}) {
  return (
    <div className="category-chips-group" role="tablist" aria-label="Filter Kategori Makanan">
      <button
        type="button"
        role="tab"
        aria-selected={!activeCategoryId}
        className={`category-chip-btn ${!activeCategoryId ? "active" : ""}`}
        onClick={() => onSelectCategory("")}
      >
        All menu
      </button>

      {categories.map((cat) => {
        const id = cat._id || cat.id;
        const isActive = activeCategoryId === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`category-chip-btn ${isActive ? "active" : ""}`}
            onClick={() => onSelectCategory(id)}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryPills;
