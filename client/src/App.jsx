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
import {
  MapPin,
  Clock,
  RefreshCw,
  ShoppingBag,
  Heart,
  Plus,
  Minus,
  Trash2,
  X,
  User,
} from "./components/Icons.jsx";

// API Services
import {
  fetchProducts,
  fetchCategories,
  fetchStoreSetting,
  getAuthToken,
  fetchAdminProfile,
  clearAuthToken,
  fetchFavorites,
  toggleFavoriteProduct,
  fetchMyOrders,
  createOrder,
} from "./services/api.js";

export function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeSetting, setStoreSetting] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [selectProductForOrder, setSelectProductForOrder] = useState(null);
  const [search, setSearch] = useState("");

  // Navigation & User states
  const [activeNavTab, setActiveNavTab] = useState("explore"); // 'explore' | 'favorites' | 'orders'
  const [favorites, setFavorites] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [bagItems, setBagItems] = useState(() => {
    try {
      const saved = localStorage.getItem("warungklik_bag");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isBagModalOpen, setIsBagModalOpen] = useState(false);
  const [bagCustomerName, setBagCustomerName] = useState("");
  const [bagCustomerPhone, setBagCustomerPhone] = useState("");
  const [bagCustomerAddress, setBagCustomerAddress] = useState("");
  const [bagNotes, setBagNotes] = useState("");
  const [isCheckingOutBag, setIsCheckingOutBag] = useState(false);

  // Admin / User auth states
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Persist shopping bag to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("warungklik_bag", JSON.stringify(bagItems));
    } catch {
      // ignore storage errors
    }
  }, [bagItems]);

  // Load user-specific data (favorites & orders)
  const loadUserAccountData = async () => {
    const token = getAuthToken();
    if (!token) {
      setFavorites([]);
      setMyOrders([]);
      return;
    }
    try {
      const [favRes, ordRes] = await Promise.all([fetchFavorites(), fetchMyOrders()]);
      if (favRes?.data) setFavorites(favRes.data);
      if (ordRes?.data) setMyOrders(ordRes.data);
    } catch {
      // ignore
    }
  };

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
          const userObj = res?.data || res?.user;
          if (userObj) {
            setAdminUser(userObj);
            setBagCustomerName(userObj.name || "");
            setBagCustomerPhone(userObj.phone || "");
            setBagCustomerAddress(userObj.address || "");
            loadUserAccountData();
          }
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
    setFavorites([]);
    setMyOrders([]);
    setActiveNavTab("explore");
  };

  // Toggle favorite product
  const handleToggleFavorite = async (product) => {
    if (!adminUser) {
      setIsAdminLoginOpen(true);
      return;
    }
    const prodId = product.id || product._id;
    const res = await toggleFavoriteProduct(prodId);
    if (res?.data) {
      setFavorites(res.data);
    }
  };

  const isProductFavorited = (product) => {
    const prodId = product.id || product._id;
    return favorites.some((f) => (f.id || f._id) === prodId);
  };

  // Shopping Bag functions
  const handleAddToBag = (product, qty = 1) => {
    const prodId = product.id || product._id;
    setBagItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === prodId);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + qty,
        };
        return updated;
      }
      return [
        ...prev,
        {
          productId: prodId,
          name: product.name,
          price: Number(product.price) || 0,
          imageUrl: product.imageurl || product.imageUrl || "/uploads/food-1.jpg",
          quantity: qty,
        },
      ];
    });
  };

  const handleUpdateBagQty = (productId, delta) => {
    setBagItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalBagCount = bagItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalBagPrice = bagItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleBagCheckout = async (e) => {
    e.preventDefault();
    if (bagItems.length === 0) return;
    setIsCheckingOutBag(true);
    try {
      const customerName = bagCustomerName.trim() || adminUser?.name || "Pelanggan WarungKlik";
      const customerPhone = bagCustomerPhone.trim() || adminUser?.phone || "";
      const customerAddress = bagCustomerAddress.trim() || adminUser?.address || "";

      const orderRes = await createOrder({
        customerName,
        customerPhone,
        customerAddress,
        items: bagItems,
        totalPrice: totalBagPrice,
        notes: bagNotes.trim(),
      });

      const orderId = orderRes?.data?.id || "";
      await loadUserAccountData();

      const phone = storeSetting?.phone || "0895338977816";
      let cleanPhone = phone.replace(/[^0-9]/g, "");
      if (cleanPhone.startsWith("0")) {
        cleanPhone = "62" + cleanPhone.slice(1);
      }

      const itemsListText = bagItems
        .map((it) => `- ${it.name} (${it.quantity}x) = ${formatRupiah(it.price * it.quantity)}`)
        .join("\n");

      const message = `Halo ${storeSetting?.storeName || "WarungKlik"}, saya ingin memesan${
        orderId ? ` (${orderId})` : ""
      }:
${itemsListText}

Total Pembayaran: ${formatRupiah(totalBagPrice)}
Nama Pemesan: ${customerName}
${customerPhone ? `No. WA: ${customerPhone}\n` : ""}${
        customerAddress ? `Alamat: ${customerAddress}\n` : ""
      }${bagNotes ? `Catatan: ${bagNotes}\n` : ""}
Mohon konfirmasi pesanan saya. Terima kasih!`;

      setBagItems([]);
      setBagNotes("");
      setIsBagModalOpen(false);
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
    } finally {
      setIsCheckingOutBag(false);
    }
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
      {isAdminView && adminUser?.role === "admin" ? (
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
            activeNavTab={activeNavTab}
            setActiveNavTab={(tab) => {
              setActiveNavTab(tab);
              if (tab === "orders" || tab === "favorites") {
                loadUserAccountData();
              }
            }}
            bagCount={totalBagCount}
            favoritesCount={favorites.length}
            onOpenBag={() => setIsBagModalOpen(true)}
            adminUser={adminUser}
            onOpenLogin={() => setIsAdminLoginOpen(true)}
            onLogout={handleLogout}
          />

          <main className="animate-fade-in" style={{ flex: 1 }}>
            <div className="container">
              {/* TAB: FAVORITES */}
              {activeNavTab === "favorites" ? (
                <section className="food-selection-section" style={{ paddingTop: "2.5rem" }}>
                  <div className="selection-heading-row">
                    <div>
                      <h2 className="selection-section-title">Menu Favorit Saya</h2>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                        Daftar hidangan pilihan yang Anda simpan untuk dipesan kembali.
                      </p>
                    </div>
                  </div>

                  {!adminUser ? (
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
                      <Heart
                        size={40}
                        style={{ color: "var(--primary)", margin: "0 auto 1rem", display: "block" }}
                      />
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                        Masuk untuk Menyimpan Menu Favorit
                      </h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                        Buat akun pembeli atau masuk agar daftar menu favorit Anda tersimpan di akun Anda.
                      </p>
                      <button
                        type="button"
                        className="category-chip-btn active"
                        onClick={() => setIsAdminLoginOpen(true)}
                      >
                        Masuk / Daftar Akun
                      </button>
                    </div>
                  ) : favorites.length === 0 ? (
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
                      <Heart
                        size={40}
                        style={{ color: "var(--primary)", margin: "0 auto 1rem", display: "block" }}
                      />
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                        Belum Ada Menu Favorit
                      </h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                        Klik ikon hati pada menu di katalog Explore untuk menyimpannya ke halaman ini.
                      </p>
                      <button
                        type="button"
                        className="category-chip-btn active"
                        onClick={() => setActiveNavTab("explore")}
                      >
                        Jelajahi Menu
                      </button>
                    </div>
                  ) : (
                    <div className="product-grid animate-fade-in">
                      {favorites.map((p) => (
                        <ProductCard
                          key={p._id || p.id}
                          product={p}
                          onSelectProduct={setSelectProductForOrder}
                          onAddToBag={handleAddToBag}
                          isFavorite={true}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ) : activeNavTab === "orders" ? (
                /* TAB: ORDERS */
                <section className="food-selection-section" style={{ paddingTop: "2.5rem" }}>
                  <div className="selection-heading-row">
                    <div>
                      <h2 className="selection-section-title">Riwayat Pesanan Saya</h2>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                        Pantau status pesanan makanan dan minuman Anda.
                      </p>
                    </div>
                  </div>

                  {!adminUser ? (
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
                      <Clock
                        size={40}
                        style={{ color: "var(--primary)", margin: "0 auto 1rem", display: "block" }}
                      />
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                        Masuk untuk Melihat Riwayat Pesanan
                      </h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                        Dengan masuk ke akun Anda, seluruh riwayat pesanan Anda tercatat secara otomatis.
                      </p>
                      <button
                        type="button"
                        className="category-chip-btn active"
                        onClick={() => setIsAdminLoginOpen(true)}
                      >
                        Masuk / Daftar Akun
                      </button>
                    </div>
                  ) : myOrders.length === 0 ? (
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
                        size={40}
                        style={{ color: "var(--primary)", margin: "0 auto 1rem", display: "block" }}
                      />
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                        Belum Ada Riwayat Pesanan
                      </h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                        Pesanan yang Anda buat melalui katalog atau My Bag akan muncul di sini.
                      </p>
                      <button
                        type="button"
                        className="category-chip-btn active"
                        onClick={() => setActiveNavTab("explore")}
                      >
                        Mulai Pesan Menu
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "1.25rem 0 3rem" }}>
                      {myOrders.map((ord) => {
                        const isDone = ord.status === "Selesai";
                        const isCancelled = ord.status === "Dibatalkan";
                        return (
                          <div
                            key={ord.id}
                            style={{
                              backgroundColor: "var(--bg-card)",
                              border: "1px solid var(--border-color)",
                              borderRadius: "var(--radius-card)",
                              padding: "1.35rem 1.5rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.85rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                                borderBottom: "1px solid var(--border-color)",
                                paddingBottom: "0.75rem",
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: "0.95rem", color: "var(--text-main)" }}>
                                  {ord.id}
                                </strong>
                                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.75rem" }}>
                                  {ord.createdAt ? new Date(ord.createdAt).toLocaleString("id-ID") : ""}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  padding: "0.25rem 0.7rem",
                                  borderRadius: "var(--radius-badge)",
                                  backgroundColor: isDone
                                    ? "var(--success-bg)"
                                    : isCancelled
                                    ? "var(--danger-bg)"
                                    : "var(--primary-soft)",
                                  color: isDone
                                    ? "var(--success)"
                                    : isCancelled
                                    ? "var(--danger)"
                                    : "var(--primary)",
                                }}
                              >
                                {ord.status}
                              </span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                              {(ord.items || []).map((it, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "0.875rem",
                                    color: "var(--text-main)",
                                  }}
                                >
                                  <span>
                                    {it.quantity}x {it.name}
                                  </span>
                                  <strong>{formatRupiah((it.price || 0) * (it.quantity || 1))}</strong>
                                </div>
                              ))}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderTop: "1px solid var(--border-color)",
                                paddingTop: "0.75rem",
                                fontSize: "0.9rem",
                              }}
                            >
                              <span style={{ color: "var(--text-secondary)" }}>
                                {ord.customerAddress ? `Alamat: ${ord.customerAddress}` : `Pemesan: ${ord.customerName}`}
                              </span>
                              <strong style={{ fontSize: "1rem", color: "var(--primary)" }}>
                                Total: {formatRupiah(ord.totalPrice)}
                              </strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ) : (
                /* TAB: EXPLORE (DEFAULT CATALOG) */
                <>
                  {/* 2. Discovery Section (Figma: Discovery) */}
                  <section className="discovery-section">
                    <div className="welcome-delivery-row">
                      <div className="welcome-block">
                        <h1 className="discovery-headline">
                          {adminUser ? `Halo, ${adminUser.name.split(" ")[0]}.` : "Good food, good day."}
                        </h1>
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
                            {adminUser?.address ||
                              storeSetting?.address ||
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
                            onAddToBag={handleAddToBag}
                            isFavorite={isProductFavorited(p)}
                            onToggleFavorite={handleToggleFavorite}
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
                </>
              )}
            </div>
          </main>

          {/* 4. Product Detail & Order Modal (Figma: Detail Produk & Pemesanan) */}
          {selectProductForOrder && (
            <OrderModal
              product={selectProductForOrder}
              storeSetting={storeSetting}
              currentUser={adminUser}
              onAddToBag={handleAddToBag}
              onOrderCreated={loadUserAccountData}
              onClose={() => setSelectProductForOrder(null)}
            />
          )}

          {/* 4B. My Bag (Shopping Cart) Modal */}
          {isBagModalOpen && (
            <div
              className="modal-backdrop"
              onClick={() => setIsBagModalOpen(false)}
              role="dialog"
              aria-modal="true"
            >
              <div
                className="admin-login-card"
                style={{ maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <ShoppingBag size={20} style={{ color: "var(--primary)" }} />
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)" }}>
                      My Bag ({totalBagCount} menu)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBagModalOpen(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {bagItems.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                    <ShoppingBag
                      size={40}
                      style={{ color: "var(--text-muted)", margin: "0 auto 0.85rem", display: "block" }}
                    />
                    <p style={{ color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.35rem" }}>
                      Keranjang pesanan Anda masih kosong
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                      Klik tombol + pada kartu menu untuk mengumpulkan beberapa menu sekaligus.
                    </p>
                    <button
                      type="button"
                      className="category-chip-btn active"
                      onClick={() => setIsBagModalOpen(false)}
                    >
                      Pilih Menu Sekarang
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBagCheckout} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        maxHeight: "240px",
                        overflowY: "auto",
                        paddingRight: "0.25rem",
                      }}
                    >
                      {bagItems.map((item) => (
                        <div
                          key={item.productId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            padding: "0.75rem",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-input)",
                            backgroundColor: "var(--bg-page)",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <strong style={{ display: "block", fontSize: "0.9rem", color: "var(--text-main)" }}>
                              {item.name}
                            </strong>
                            <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600 }}>
                              {formatRupiah(item.price * item.quantity)}
                            </span>
                          </div>

                          <div className="qty-counter" style={{ gap: "0.5rem" }}>
                            <button
                              type="button"
                              className="qty-counter-btn"
                              onClick={() => handleUpdateBagQty(item.productId, -1)}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="qty-counter-val" style={{ fontSize: "0.875rem" }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="qty-counter-btn"
                              onClick={() => handleUpdateBagQty(item.productId, 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="form-field">
                      <label className="field-label">Nama Pemesan</label>
                      <input
                        type="text"
                        required
                        className="figma-input"
                        placeholder="Nama lengkap Anda..."
                        value={bagCustomerName}
                        onChange={(e) => setBagCustomerName(e.target.value)}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div className="form-field">
                        <label className="field-label">No. WhatsApp</label>
                        <input
                          type="text"
                          className="figma-input"
                          placeholder="0812..."
                          value={bagCustomerPhone}
                          onChange={(e) => setBagCustomerPhone(e.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label">Alamat Pengiriman</label>
                        <input
                          type="text"
                          className="figma-input"
                          placeholder="Alamat tujuan..."
                          value={bagCustomerAddress}
                          onChange={(e) => setBagCustomerAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="field-label">Catatan Pesanan (Opsional)</label>
                      <input
                        type="text"
                        className="figma-input"
                        placeholder="Contoh: Bungkus terpisah, sambal dipisah..."
                        value={bagNotes}
                        onChange={(e) => setBagNotes(e.target.value)}
                      />
                    </div>

                    <div className="order-total-bar">
                      <span>Total Pembayaran ({totalBagCount} porsi)</span>
                      <strong>{formatRupiah(totalBagPrice)}</strong>
                    </div>

                    <button type="submit" className="btn-whatsapp-order" disabled={isCheckingOutBag}>
                      <ShoppingBag size={18} />
                      <span>
                        {isCheckingOutBag ? "Memproses Pesanan..." : "Checkout & Kirim ke WhatsApp"}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            </div>
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

      {/* User & Admin Auth / Profile Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        currentUser={adminUser}
        onLogout={handleLogout}
        onOpenAdminConsole={() => setIsAdminView(true)}
        onLogin={(user) => {
          setAdminUser(user);
          setBagCustomerName(user.name || "");
          setBagCustomerPhone(user.phone || "");
          setBagCustomerAddress(user.address || "");
          loadUserAccountData();
          if (user.role === "admin") {
            setIsAdminView(true);
          }
          setIsAdminLoginOpen(false);
        }}
      />
    </div>
  );
}

export default App;
