import React from "react";
import { Compass, Heart, Clock, ShoppingBag, User, Store } from "./Icons.jsx";

export function Header({
  storeSetting,
  isAdminView,
  setIsAdminView,
  activeNavTab = "explore",
  setActiveNavTab,
  bagCount = 0,
  favoritesCount = 0,
  onOpenBag,
  adminUser,
  onOpenLogin,
}) {
  const brandName = storeSetting?.storeName || "Daily greens";

  const handleNavClick = (tab) => {
    setIsAdminView(false);
    if (setActiveNavTab) setActiveNavTab(tab);
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Left: Brand */}
        <div className="header-brand">
          <button
            type="button"
            className="brand-logo-btn"
            onClick={() => handleNavClick("explore")}
            aria-label={brandName}
          >
            <img
              src="/logo-warungklik.png"
              alt="WarungKlik"
              className="brand-logo-img"
            />
          </button>
        </div>

        {/* Center: Destinations (Figma: Destinations) */}
        <nav className="header-destinations" aria-label="Main Destinations">
          <button
            type="button"
            className={`nav-destination-item ${!isAdminView && activeNavTab === "explore" ? "active" : ""}`}
            onClick={() => handleNavClick("explore")}
          >
            <Compass size={17} />
            <span>Explore</span>
            {!isAdminView && activeNavTab === "explore" && <span className="active-nav-indicator" />}
          </button>

          <button
            type="button"
            className={`nav-destination-item ${!isAdminView && activeNavTab === "favorites" ? "active" : ""}`}
            onClick={() => handleNavClick("favorites")}
          >
            <Heart size={17} />
            <span>Favorites{favoritesCount > 0 ? ` (${favoritesCount})` : ""}</span>
            {!isAdminView && activeNavTab === "favorites" && <span className="active-nav-indicator" />}
          </button>

          <button
            type="button"
            className={`nav-destination-item ${!isAdminView && activeNavTab === "orders" ? "active" : ""}`}
            onClick={() => handleNavClick("orders")}
          >
            <Clock size={17} />
            <span>Orders</span>
            {!isAdminView && activeNavTab === "orders" && <span className="active-nav-indicator" />}
          </button>
        </nav>

        {/* Right: Account Actions (Figma: Account actions) */}
        <div className="header-account-actions">
          <button
            type="button"
            className="my-bag-button"
            onClick={onOpenBag}
            aria-label="Buka keranjang belanja"
          >
            <ShoppingBag size={18} />
            <span>My bag{bagCount > 0 ? ` (${bagCount})` : ""}</span>
          </button>

          {adminUser?.role === "admin" && (
            <button
              type="button"
              className="category-chip-btn"
              onClick={() => setIsAdminView(!isAdminView)}
              style={{ padding: "0.45rem 0.85rem", fontSize: "0.8125rem" }}
              title="Buka Admin Console"
            >
              <Store size={15} />
              <span>{isAdminView ? "Katalog" : "Admin"}</span>
            </button>
          )}

          {adminUser ? (
            <button
              type="button"
              className="profile-avatar-btn"
              onClick={onOpenLogin}
              title={`Akun: ${adminUser.name}`}
            >
              {adminUser.name ? adminUser.name.slice(0, 2).toUpperCase() : "US"}
            </button>
          ) : (
            <button
              type="button"
              className="profile-avatar-btn"
              onClick={onOpenLogin}
              title="Masuk / Daftar Akun"
              aria-label="Masuk atau Daftar Akun"
            >
              <User size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
