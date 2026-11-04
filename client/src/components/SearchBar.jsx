import React from "react";
import { Search, Sliders, X } from "./Icons.jsx";

export function SearchBar({ search = "", setSearch, placeholder = "What are you craving?" }) {
  return (
    <div className="figma-search-bar">
      <span className="search-icon-muted">
        <Search size={18} />
      </span>
      <input
        type="text"
        className="figma-search-input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        aria-label="Cari menu makanan"
      />
      {search && (
        <button
          type="button"
          onClick={() => setSearch("")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
        >
          <X size={15} />
        </button>
      )}
      <span className="control-divider" />
      <span className="search-icon-muted" style={{ cursor: "pointer" }} title="Filter lanjutan">
        <Sliders size={18} />
      </span>
    </div>
  );
}

export default SearchBar;
