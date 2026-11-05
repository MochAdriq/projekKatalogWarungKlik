import React from "react";
import { Compass, Heart, Clock, ShoppingBag, User } from "./Icons.jsx";

export function Header({
  storeSetting,
  isAdminView,
  setIsAdminView,
  adminUser,
  onOpenLogin,
  onLogout,
}) {
  const brandName = storeSetting?.storeName || "Daily greens";

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Left: Brand */}
        <div className="header-brand">
          <button
            type="button"
            className="brand-logo-btn"
            onClick={() => setIsAdminView(false)}
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
            className="nav-destination-item active"
            onClick={() => setIsAdminView(false)}
          >
            <Compass size={17} />
            <span>Explore</span>
            <span className="active-nav-indicator" />
          </button>

          <button
            type="button"
            className="nav-destination-item"
            onClick={() => alert("Fitur Favorites segera hadir!")}
          >
            <Heart size={17} />
            <span>Favorites</span>
          </button>

          <button
            type="button"
            className="nav-destination-item"
            onClick={() => alert("Fitur Orders segera hadir!")}
          >
            <Clock size={17} />
            <span>Orders</span>
          </button>
        </nav>

        {/* Right: Account Actions (Figma: Account actions) */}
        <div className="header-account-actions">
          <button
            type="button"
            className="my-bag-button"
            onClick={() => alert("Keranjang belanja Anda")}
            aria-label="Buka keranjang belanja"
          >
            <ShoppingBag size={18} />
            <span>My bag</span>
          </button>

          {adminUser ? (
            <button
              type="button"
              className="profile-avatar-btn"
              onClick={() => setIsAdminView(!isAdminView)}
              title={isAdminView ? "Kembali ke Katalog" : "Buka Admin Console"}
            >
              {adminUser.name ? adminUser.name.slice(0, 2).toUpperCase() : "AD"}
            </button>
          ) : (
            <button
              type="button"
              className="profile-avatar-btn"
              onClick={onOpenLogin}
              title="Masuk Admin Console"
              aria-label="Masuk Admin"
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
