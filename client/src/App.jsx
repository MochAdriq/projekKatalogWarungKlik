import React, { useState, useEffect } from "react";
import "./App.css";

// Components
import Header from "./components/Header.jsx";
import SearchBar from "./components/SearchBar.jsx";
import CategoryPills from "./components/CategoryPills.jsx";
import ProductCard from "./components/ProductCard.jsx";
import OrderModal from "./components/OrderModal.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import AdminLoginModal from "./components/AdminLoginModal.jsx";

// Pure SVG Icons (Strictly no emoticons)
import { MapPin, Clock, RefreshCw, ShoppingBag } from "./components/Icons.jsx";

// API Services
import {
  fetchProducts,
  fetchCategories,
  fetchStoreSetting,
  getAuthToken,
  fetchAdminProfile,
  clearAuthToken,
} from "./services/api.js";

export function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeSetting, setStoreSetting] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [selectProductForOrder, setSelectProductForOrder] = useState(null);
  const [search, setSearch] = useState("");

  // Admin states
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load all initial data from node.js backend
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, storeRes] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchStoreSetting(),
      ]);

      if (prodRes?.data) setProducts(prodRes.data);
      if (catRes?.data) setCategories(catRes.data);
      if (storeRes?.data) setStoreSetting(storeRes.data);
    } catch (error) {
      console.error("Error loading data: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const token = getAuthToken();
    if (token) {
      fetchAdminProfile()
        .then((res) => {
          if (res?.data || res?.user) setAdminUser(res.data || res.user);
        })
        .catch(() => {
          clearAuthToken();
          setAdminUser(null);
        });
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    clearAuthToken();
    setAdminUser(null);
    setIsAdminView(false);
    alert("Anda telah logout dari Admin Console");
    window.location.href = "/";
  };

  // Filter products for customer catalog view
  const filteredProducts = products.filter((p) => {
    const matchesCat = !activeCategoryId || p.categoryId === activeCategoryId;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="app-layout">
      {isAdminView && adminUser ? (
        <AdminDashboard
          products={products}
          categories={categories}
          storeSetting={storeSetting}
          adminUser={adminUser}
          onRefreshData={loadData}
          onBackToCatalog={() => setIsAdminView(false)}
          onLogout={handleLogout}
        />
      ) : (
        <>
          {/* 1. Desktop Navigation */}
          <Header
            storeSetting={storeSetting}
            isAdminView={isAdminView}
            setIsAdminView={setIsAdminView}
            adminUser={adminUser}
            onOpenLogin={() => setIsAdminLoginOpen(true)}
            onLogout={handleLogout}
          />

          <main className="animate-fade-in" style={{ flex: 1 }}>
            <div className="container">
              {/* 2. Discovery Section (Figma: Discovery) */}
              <section className="discovery-section">
                <div className="welcome-delivery-row">
                  <div className="welcome-block">
                    <h1 className="discovery-headline">Good food, good day.</h1>
                    <p className="discovery-desc">
                      {storeSetting?.tagline ||
                        "Freshly made. Thoughtfully sourced. To your door."}
                    </p>
                  </div>

                  <div className="delivery-address-card">
                    <div className="location-marker-icon">
                      <MapPin size={18} />
                    </div>
                    <div className="delivery-info-text">
                      <span className="delivery-label">Delivery to</span>
                      <strong className="delivery-val">
                        {storeSetting?.address ||
                          storeSetting?.adrress ||
                          "Jakarta, Indonesia"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Browse Controls: Category Chips & Search Bar */}
                <div className="browse-controls-row">
                  <CategoryPills
                    categories={categories}
                    activeCategoryId={activeCategoryId}
                    onSelectCategory={setActiveCategoryId}
                    totalProductCount={products.length}
                  />

                  <SearchBar
                    search={search}
                    setSearch={setSearch}
                    placeholder="What are you craving?"
                  />
                </div>
              </section>

              {/* 3. Food Selection & Product Grid (Figma: Food selection) */}
              <section className="food-selection-section">
                <div className="selection-heading-row">
                  <h2 className="selection-section-title">Made fresh for you</h2>
                  <div className="delivery-estimate-badge">
                    <Clock size={16} />
                    <span>20–30 min</span>
                  </div>
                </div>

                {isLoading ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "4rem 1rem",
                      color: "var(--primary)",
                    }}
                  >
                    <RefreshCw
                      size={32}
                      className="animate-spin"
                      style={{ margin: "0 auto 1rem", display: "block" }}
                    />
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
                      Memuat menu dari dapur...
                    </p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="product-grid animate-fade-in">
                    {filteredProducts.map((p) => (
                      <ProductCard
                        key={p._id || p.id}
                        product={p}
                        onSelectProduct={setSelectProductForOrder}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "4rem 1.5rem",
                      backgroundColor: "var(--bg-card)",
                      borderRadius: "var(--radius-card)",
                      border: "1px dashed var(--border-color)",
                      margin: "1.5rem 0",
                    }}
                  >
                    <ShoppingBag
                      size={44}
                      style={{ color: "var(--primary)", margin: "0 auto 1rem", display: "block" }}
                    />
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                      Belum ada menu yang cocok
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                      Coba ganti kata kunci pencarian atau pilih kategori lain.
                    </p>
                    <button
                      type="button"
                      className="category-chip-btn active"
                      onClick={() => {
                        setSearch("");
                        setActiveCategoryId("");
                      }}
                    >
                      Tampilkan Semua Menu
                    </button>
                  </div>
                )}
              </section>
            </div>
          </main>

          {/* 4. Product Detail & Order Modal (Figma: Detail Produk & Pemesanan) */}
          {selectProductForOrder && (
            <OrderModal
              product={selectProductForOrder}
              storeSetting={storeSetting}
              onClose={() => setSelectProductForOrder(null)}
            />
          )}

          {/* 5. Catalog Footer (Figma: Catalog footer) */}
          <footer className="catalog-footer">
            <div className="container footer-content-row">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <img
                  src="/logo-warungklik.png"
                  alt="WarungKlik"
                  className="footer-logo-img"
                />
              </div>
              <span className="footer-brand-promise">
                Freshly made. Thoughtfully sourced. To your door.
              </span>
            </div>
          </footer>
        </>
      )}

      {/* Admin Login Modal (Figma: Login Admin) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLogin={(user) => {
          setAdminUser(user);
          setIsAdminView(true);
          setIsAdminLoginOpen(false);
        }}
      />
    </div>
  );
}

export default App;
