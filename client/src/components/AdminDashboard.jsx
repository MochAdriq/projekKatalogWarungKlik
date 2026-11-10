import React, { useState, useRef, useEffect } from "react";
import {
  Store,
  Compass,
  LogOut,
  Plus,
  RefreshCw,
  ChevronRight,
  Check,
  Edit,
  Trash2,
  X,
  AlertCircle,
  Upload,
  Lock,
  User,
  Sliders,
  Search,
  Eye,
  EyeOff,
} from "./Icons.jsx";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStock,
  deleteCategory,
  getAuthToken,
  fetchAllOrders,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  fetchAllUsers,
  deleteUserAccount,
  updateStoreSetting,
  updateAdminProfile,
  updateUserByAdmin,
} from "../services/api.js";

export function AdminDashboard({
  products = [],
  categories = [],
  storeSetting,
  adminUser,
  onUpdateAdminUser,
  onRefreshData,
  onBackToCatalog,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("products"); // 'products', 'categories', 'orders', 'users', 'settings'
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Store Settings Form State
  const [storeForm, setStoreForm] = useState({
    storeName: storeSetting?.storeName || "Toko Berkah Nusantara",
    tagline: storeSetting?.tagline || "Kuliner Lezat & Segar Siap Antar Setiap Hari",
    phone: storeSetting?.phone || "6281234567890",
    address: storeSetting?.address || "Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan",
  });
  const [isSavingStore, setIsSavingStore] = useState(false);

  // Admin Profile Form State
  const [adminForm, setAdminForm] = useState({
    name: adminUser?.name || "Admin Daily Greens",
    email: adminUser?.email || "admin@warungklik.com",
    newPassword: "",
  });
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Edit / Reset Password User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    newPassword: "",
  });
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [showUserResetPassword, setShowUserResetPassword] = useState(false);

  // Order Filtering & Bulk Status Update States
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkTargetStatus, setBulkTargetStatus] = useState("Diproses");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  useEffect(() => {
    if (storeSetting) {
      setStoreForm({
        storeName: storeSetting.storeName || "",
        tagline: storeSetting.tagline || "",
        phone: storeSetting.phone || "",
        address: storeSetting.address || "",
      });
    }
  }, [storeSetting]);

  useEffect(() => {
    if (adminUser) {
      setAdminForm((prev) => ({
        ...prev,
        name: adminUser.name || "",
        email: adminUser.email || "",
      }));
    }
  }, [adminUser]);

  const handleSaveStoreSettings = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setIsSavingStore(true);
    try {
      const res = await updateStoreSetting(storeForm);
      if (res?.success) {
        setStatusMessage("Pengaturan Profil & WhatsApp Toko berhasil disimpan!");
        if (onRefreshData) onRefreshData();
      } else {
        setErrorMessage(res?.message || "Gagal menyimpan pengaturan toko.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat menyimpan pengaturan toko.");
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setIsSavingAdmin(true);
    try {
      const res = await updateAdminProfile(adminForm);
      if (res?.success) {
        setStatusMessage("Profil & Keamanan Admin berhasil diperbarui!");
        setAdminForm((prev) => ({ ...prev, newPassword: "" }));
        if (res.data && onUpdateAdminUser) {
          onUpdateAdminUser(res.data);
        }
      } else {
        setErrorMessage(res?.message || "Gagal memperbarui profil admin.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat memperbarui profil admin.");
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      address: u.address || "",
      newPassword: "",
    });
  };

  const handleSaveUserByAdmin = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setErrorMessage("");
    setStatusMessage("");
    setIsSavingUser(true);
    try {
      const res = await updateUserByAdmin(editingUser.id, userForm);
      if (res?.success) {
        setStatusMessage(
          userForm.newPassword.trim()
            ? `Data & password baru untuk '${userForm.name}' berhasil disimpan!`
            : `Data user '${userForm.name}' berhasil diperbarui!`
        );
        setEditingUser(null);
        loadAdminExtras();
      } else {
        setErrorMessage(res?.message || "Gagal memperbarui akun user.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat memperbarui akun user.");
    } finally {
      setIsSavingUser(false);
    }
  };

  const loadAdminExtras = async () => {
    try {
      const [ordRes, usrRes] = await Promise.all([fetchAllOrders(), fetchAllUsers()]);
      if (ordRes?.data) setOrders(ordRes.data);
      if (usrRes?.data) setUsers(usrRes.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAdminExtras();
  }, []);

  const handleChangeOrderStatus = async (orderId, nextStatus) => {
    const res = await updateOrderStatus(orderId, nextStatus);
    if (res?.success) {
      setStatusMessage(`Status pesanan ${orderId} diubah menjadi '${nextStatus}'`);
      loadAdminExtras();
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = orderStatusFilter === "ALL" || ord.status === orderStatusFilter;
    const q = orderSearch.trim().toLowerCase();
    if (!q) return matchesStatus;
    const matchesId = (ord.id || "").toLowerCase().includes(q);
    const matchesCustomer = (ord.customerName || "").toLowerCase().includes(q);
    const matchesPhone = (ord.customerPhone || "").toLowerCase().includes(q);
    const matchesItems = (ord.items || []).some((it) =>
      (it.name || "").toLowerCase().includes(q)
    );
    return matchesStatus && (matchesId || matchesCustomer || matchesPhone || matchesItems);
  });

  const handleToggleSelectOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleSelectAllOrders = () => {
    const visibleIds = filteredOrders.map((o) => o.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedOrderIds.includes(id));
    if (allSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkStatusSubmit = async () => {
    if (selectedOrderIds.length === 0) return;
    setErrorMessage("");
    setStatusMessage("");
    setIsBulkUpdating(true);
    try {
      const res = await bulkUpdateOrderStatus(selectedOrderIds, bulkTargetStatus);
      if (res?.success) {
        setStatusMessage(
          res.message ||
            `${selectedOrderIds.length} pesanan berhasil diubah ke status '${bulkTargetStatus}'`
        );
        setSelectedOrderIds([]);
        await loadAdminExtras();
      } else {
        setErrorMessage(res?.message || "Gagal memperbarui status pesanan secara massal.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat memperbarui status pesanan secara massal.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const res = await deleteUserAccount(user.id);
    if (res?.success) {
      setStatusMessage(`Akun '${user.name}' berhasil dihapus.`);
      loadAdminExtras();
    } else {
      setErrorMessage(res?.message || "Gagal menghapus user.");
    }
  };

  // Product Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null for create, object for edit
  const [productForm, setProductForm] = useState({
    name: "",
    categoryId: "",
    price: "",
    description: "",
    stockStatus: "Tersedia",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const fileInputRef = useRef(null);

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'product' | 'category', item }

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setSelectedFile(null);
    setPreviewUrl("");
    setProductForm({
      name: "",
      categoryId: categories[0]?.id || categories[0]?._id || "",
      price: "",
      description: "",
      stockStatus: "Tersedia",
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setSelectedFile(null);
    const existingImg = p.imageUrl || p.imageurl || p.image || "";
    setPreviewUrl(
      existingImg.startsWith("http") || existingImg.startsWith("/")
        ? existingImg
        : existingImg
        ? `/${existingImg}`
        : ""
    );
    setProductForm({
      name: p.name || "",
      categoryId: p.categoryId || p.category_id || categories[0]?.id || "",
      price: p.price || "",
      description: p.description || "",
      stockStatus:
        p.stockStatus === "out_of_stock" || p.stockStatus === "Habis" ? "Habis" : "Tersedia",
    });
    setIsProductModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Ukuran file foto maksimal 10 MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage("");
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSavingProduct(true);

    try {
      const formData = new FormData();
      formData.append("name", productForm.name.trim());
      formData.append("categoryId", productForm.categoryId);
      formData.append("price", String(Number(productForm.price)));
      formData.append("description", productForm.description.trim());
      formData.append("stockStatus", productForm.stockStatus);

      if (selectedFile) {
        formData.append("image", selectedFile);
      } else if (editingProduct) {
        const existingImg = editingProduct.imageUrl || editingProduct.imageurl || editingProduct.image || "";
        formData.append("imageurl", existingImg);
      } else {
        formData.append("imageurl", "/uploads/food-1.jpg");
      }

      let res;
      if (editingProduct) {
        const id = editingProduct.id || editingProduct._id;
        res = await updateProduct(id, formData);
      } else {
        res = await createProduct(formData);
      }

      if (res && (res.success || res.data)) {
        setStatusMessage(
          editingProduct ? "Menu berhasil diperbarui!" : "Menu baru berhasil ditambahkan!"
        );
        setIsProductModalOpen(false);
        onRefreshData();
      } else {
        setErrorMessage(res?.message || "Gagal menyimpan menu. Silakan coba lagi.");
      }
    } catch (err) {
      setErrorMessage("Terjadi kendala saat menyimpan. Pastikan semua data terisi dengan benar.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleToggleStock = async (p) => {
    const id = p.id || p._id;
    try {
      const res = await toggleProductStock(id);
      if (res && res.success) {
        setStatusMessage(`Status ${p.name} berhasil diubah!`);
        onRefreshData();
      }
    } catch (err) {
      setErrorMessage("Gagal mengubah status ketersediaan.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, item } = deleteConfirm;
    const id = item.id || item._id;

    try {
      if (type === "product") {
        const res = await deleteProduct(id);
        if (res && res.success) {
          setStatusMessage(`Menu '${item.name}' berhasil dihapus dari katalog.`);
          onRefreshData();
        } else {
          setErrorMessage(res?.message || "Gagal menghapus menu.");
        }
      } else if (type === "category") {
        const res = await deleteCategory(id);
        if (res && res.success) {
          setStatusMessage(`Kategori '${item.name}' berhasil dihapus.`);
          onRefreshData();
        } else {
          setErrorMessage(res?.message || "Gagal menghapus kategori.");
        }
      }
    } catch (err) {
      setErrorMessage("Terjadi kendala saat menghapus data.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const token = getAuthToken();
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCategoryName("");
        setStatusMessage(`Kategori '${data.data.name}' berhasil ditambahkan!`);
        onRefreshData();
      } else {
        setErrorMessage(data.message || "Gagal menambah kategori");
      }
    } catch (err) {
      setErrorMessage("Terjadi kendala saat menambahkan kategori");
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div style={{ marginBottom: "1.15rem" }}>
            <img
              src="/logo-warungklik.png"
              alt="WarungKlik Admin Console"
              style={{ height: "34px", width: "auto", display: "block" }}
            />
          </div>

          <div className="workspace-badge-selector">
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--primary-soft)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Store size={18} />
            </div>
            <div>
              <strong>{storeSetting?.storeName || "Daily greens"}</strong>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pengelola Warung</div>
            </div>
          </div>

          <div
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "var(--text-disabled)",
              letterSpacing: "0.08em",
              marginBottom: "0.75rem",
            }}
          >
            MENU PENGELOLA
          </div>

          <ul className="admin-nav-links">
            <li>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === "products" ? "active" : ""}`}
                onClick={() => setActiveTab("products")}
              >
                <span>Daftar Menu</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: activeTab === "products" ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  ({products.length})
                </span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === "categories" ? "active" : ""}`}
                onClick={() => setActiveTab("categories")}
              >
                <span>Kategori Menu</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: activeTab === "categories" ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  ({categories.length})
                </span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("orders");
                  loadAdminExtras();
                }}
              >
                <span>Pesanan Masuk</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: activeTab === "orders" ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  ({orders.length})
                </span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === "users" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("users");
                  loadAdminExtras();
                }}
              >
                <span>Daftar User</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: activeTab === "users" ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  ({users.length})
                </span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`admin-nav-item ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                <span>Pengaturan Toko & Admin</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="category-chip-btn"
            style={{ width: "100%", justifyContent: "center", marginBottom: "1rem" }}
            onClick={onBackToCatalog}
          >
            <Compass size={16} />
            <span>Lihat Katalog Toko</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "var(--primary-soft)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                }}
              >
                {adminUser?.name ? adminUser.name.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-main)" }}>
                  {adminUser?.name || adminUser?.email?.split("@")[0] || "Admin"}
                </div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Pengelola</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", padding: "4px" }}
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Panel */}
      <main className="admin-main-panel">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            marginBottom: "1.25rem",
          }}
        >
          <span>Pengelola</span>
          <ChevronRight size={14} />
          <strong style={{ color: "var(--text-main)", fontWeight: 600 }}>
            {activeTab === "products"
              ? "Daftar Menu"
              : activeTab === "categories"
              ? "Kategori Menu"
              : activeTab === "orders"
              ? "Pesanan Masuk"
              : activeTab === "users"
              ? "Daftar User"
              : "Pengaturan Toko & Admin"}
          </strong>
        </div>

        {/* Notifications */}
        {statusMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.85rem 1.25rem",
              backgroundColor: "var(--success-bg)",
              border: "1px solid #bbf7d0",
              color: "var(--success)",
              borderRadius: "var(--radius-input)",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Check size={16} />
              <span>{statusMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.85rem 1.25rem",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid #fecaca",
              color: "var(--danger)",
              borderRadius: "var(--radius-input)",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* TAB 1: DAFTAR PRODUK / MENU */}
        {activeTab === "products" && (
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-card)",
              padding: "1.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Katalog Menu Makanan & Minuman
                </h1>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Total {products.length} menu siap disajikan
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="button" className="category-chip-btn" onClick={onRefreshData}>
                  <RefreshCw size={14} />
                  <span>Segarkan</span>
                </button>
                <button
                  type="button"
                  className="btn-whatsapp-order"
                  style={{ width: "auto", margin: 0, padding: "0.55rem 1.15rem", fontSize: "0.875rem" }}
                  onClick={handleOpenCreateProduct}
                >
                  <Plus size={16} />
                  <span>Tambah Menu</span>
                </button>
              </div>
            </div>

            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                Belum ada menu yang terdaftar. Klik tombol <strong>"+ Tambah Menu"</strong> di atas untuk mulai menambahkan.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>
                        Foto & Nama Menu
                      </th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>
                        Kategori
                      </th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>
                        Harga
                      </th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>
                        Ketersediaan
                      </th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", textAlign: "right" }}>
                        Tindakan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const isOutOfStock =
                        p.stockStatus === "out_of_stock" || p.stockStatus === "Habis";
                      return (
                        <tr key={p._id || p.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <img
                                src={
                                  (p.imageUrl || p.image || "").startsWith("http") || (p.imageUrl || p.image || "").startsWith("/")
                                    ? p.imageUrl || p.image
                                    : p.imageUrl || p.image || "/uploads/food-1.jpg"
                                }
                                alt={p.name}
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  borderRadius: "var(--radius-sm)",
                                  objectFit: "cover",
                                  backgroundColor: "var(--bg-muted)",
                                }}
                              />
                              <div>
                                <strong style={{ color: "var(--text-main)", display: "block" }}>{p.name}</strong>
                                {p.description && (
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                    {p.description.slice(0, 48)}...
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{p.categoryName || "-"}</td>
                          <td style={{ padding: "1rem", fontWeight: 700, color: "var(--text-forest)" }}>
                            {formatRupiah(p.price)}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <button
                              type="button"
                              onClick={() => handleToggleStock(p)}
                              title="Klik untuk ubah ketersediaan"
                              style={{
                                cursor: "pointer",
                                border: "none",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                padding: "0.25rem 0.65rem",
                                borderRadius: "var(--radius-badge)",
                                backgroundColor: isOutOfStock ? "var(--danger-bg)" : "var(--success-bg)",
                                color: isOutOfStock ? "var(--danger)" : "var(--success)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                              }}
                            >
                              <span>{isOutOfStock ? "Habis" : "Tersedia"}</span>
                              <RefreshCw size={11} style={{ opacity: 0.7 }} />
                            </button>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "right" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                              <button
                                type="button"
                                className="category-chip-btn"
                                style={{ padding: "0.4rem 0.7rem", fontSize: "0.8125rem" }}
                                onClick={() => handleOpenEditProduct(p)}
                                title="Edit Menu"
                              >
                                <Edit size={14} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                className="category-chip-btn"
                                style={{
                                  padding: "0.4rem 0.7rem",
                                  fontSize: "0.8125rem",
                                  color: "var(--danger)",
                                  borderColor: "#fecaca",
                                }}
                                onClick={() => setDeleteConfirm({ type: "product", item: p })}
                                title="Hapus Menu"
                              >
                                <Trash2 size={14} />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KATEGORI */}
        {activeTab === "categories" && (
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-card)",
              padding: "1.75rem",
            }}
          >
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.35rem" }}>
              Kelola Kategori Menu
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Atur kelompok menu agar pembeli lebih mudah menemukan makanan favorit mereka.
            </p>

            <form onSubmit={handleAddCategory} style={{ display: "flex", gap: "0.75rem", maxWidth: "460px", marginBottom: "1.75rem" }}>
              <input
                type="text"
                className="figma-input"
                placeholder="Nama kategori baru..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button
                type="submit"
                className="btn-whatsapp-order"
                style={{ width: "auto", margin: 0, padding: "0.55rem 1.15rem", whiteSpace: "nowrap" }}
              >
                <Plus size={16} />
                <span>Tambah Kategori</span>
              </button>
            </form>

            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {categories.map((cat) => (
                <li
                  key={cat._id || cat.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.95rem 1.25rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-input)",
                    backgroundColor: "var(--bg-page)",
                    fontSize: "0.875rem",
                  }}
                >
                  <div>
                    <strong style={{ color: "var(--text-main)", fontSize: "0.9375rem" }}>{cat.name}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ type: "category", item: cat })}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.4rem 0.75rem",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid #fecaca",
                      borderRadius: "var(--radius-input)",
                      color: "var(--danger)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                    title={`Hapus kategori ${cat.name}`}
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* TAB 3: PESANAN MASUK */}
        {activeTab === "orders" && (
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-card)",
              padding: "1.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Daftar Pesanan Pelanggan
                </h1>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Filter pesanan dan ubah status pesanan secara satuan maupun massal (bulk)
                </p>
              </div>
              <button type="button" className="category-chip-btn" onClick={loadAdminExtras}>
                <RefreshCw size={14} />
                <span>Segarkan</span>
              </button>
            </div>

            {/* Filter Controls: Status Tabs & Search Input */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1.25rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <div className="category-chips-group">
                {[
                  { value: "ALL", label: `Semua (${orders.length})` },
                  {
                    value: "Menunggu Konfirmasi",
                    label: `Menunggu Konfirmasi (${orders.filter((o) => o.status === "Menunggu Konfirmasi").length})`,
                  },
                  {
                    value: "Diproses",
                    label: `Diproses (${orders.filter((o) => o.status === "Diproses").length})`,
                  },
                  {
                    value: "Selesai",
                    label: `Selesai (${orders.filter((o) => o.status === "Selesai").length})`,
                  },
                  {
                    value: "Dibatalkan",
                    label: `Dibatalkan (${orders.filter((o) => o.status === "Dibatalkan").length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    className={`category-chip-btn ${orderStatusFilter === tab.value ? "active" : ""}`}
                    style={{ padding: "0.45rem 0.95rem", fontSize: "0.8125rem" }}
                    onClick={() => setOrderStatusFilter(tab.value)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="figma-search-bar" style={{ width: "290px", padding: "0.5rem 0.85rem" }}>
                <span className="search-icon-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="figma-search-input"
                  placeholder="Cari ID, nama, WA, atau menu..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
                {orderSearch && (
                  <button
                    type="button"
                    onClick={() => setOrderSearch("")}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Bulk Status Action Bar */}
            {selectedOrderIds.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.85rem",
                  padding: "0.85rem 1.15rem",
                  backgroundColor: "var(--primary-soft)",
                  border: "1px solid rgba(52, 91, 61, 0.25)",
                  borderRadius: "var(--radius-input)",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-forest)" }}>
                  {selectedOrderIds.length} pesanan dipilih
                </div>

                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                    Ubah status ke:
                  </span>
                  <select
                    className="figma-input"
                    style={{ width: "auto", padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }}
                    value={bulkTargetStatus}
                    onChange={(e) => setBulkTargetStatus(e.target.value)}
                  >
                    <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>

                  <button
                    type="button"
                    className="btn-whatsapp-order"
                    style={{ width: "auto", margin: 0, padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
                    onClick={handleBulkStatusSubmit}
                    disabled={isBulkUpdating}
                  >
                    <Check size={15} />
                    <span>
                      {isBulkUpdating
                        ? "Memproses..."
                        : `Terapkan ke ${selectedOrderIds.length} Pesanan`}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="category-chip-btn"
                    style={{ padding: "0.45rem 0.85rem", fontSize: "0.8125rem" }}
                    onClick={() => setSelectedOrderIds([])}
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>
            )}

            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                {orders.length === 0
                  ? "Belum ada pesanan yang masuk."
                  : "Tidak ada pesanan yang cocok dengan filter atau pencarian."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "0.75rem 0.75rem", width: "40px" }}>
                        <input
                          type="checkbox"
                          aria-label="Pilih semua pesanan yang tampil"
                          checked={
                            filteredOrders.length > 0 &&
                            filteredOrders.every((o) => selectedOrderIds.includes(o.id))
                          }
                          onChange={handleToggleSelectAllOrders}
                          style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
                        />
                      </th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>ID & Waktu</th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Pelanggan</th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Rincian Menu</th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Total</th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Status Pesanan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => {
                      const isChecked = selectedOrderIds.includes(ord.id);
                      return (
                        <tr
                          key={ord.id}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                            backgroundColor: isChecked ? "rgba(52, 91, 61, 0.04)" : "transparent",
                          }}
                        >
                          <td style={{ padding: "1rem 0.75rem" }}>
                            <input
                              type="checkbox"
                              aria-label={`Pilih pesanan ${ord.id}`}
                              checked={isChecked}
                              onChange={() => handleToggleSelectOrder(ord.id)}
                              style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
                            />
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <strong style={{ display: "block", color: "var(--text-main)" }}>{ord.id}</strong>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleString("id-ID") : ""}
                            </span>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <strong style={{ display: "block", color: "var(--text-main)" }}>{ord.customerName}</strong>
                            {ord.customerPhone && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>
                                WA: {ord.customerPhone}
                              </span>
                            )}
                            {ord.customerAddress && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                                {ord.customerAddress}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            {(ord.items || []).map((it, idx) => (
                              <div key={idx} style={{ fontSize: "0.8125rem", color: "var(--text-main)" }}>
                                {it.quantity}x {it.name}
                              </div>
                            ))}
                            {ord.notes && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                Catatan: {ord.notes}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "1rem", fontWeight: 700, color: "var(--text-forest)" }}>
                            {formatRupiah(ord.totalPrice)}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <select
                              className="figma-input"
                              style={{ padding: "0.4rem 0.65rem", fontSize: "0.8125rem", width: "auto" }}
                              value={ord.status}
                              onChange={(e) => handleChangeOrderStatus(ord.id, e.target.value)}
                            >
                              <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                              <option value="Diproses">Diproses</option>
                              <option value="Selesai">Selesai</option>
                              <option value="Dibatalkan">Dibatalkan</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DAFTAR USER */}
        {activeTab === "users" && (
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-card)",
              padding: "1.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Daftar Akun Pembeli Terdaftar
                </h1>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Total {users.length} pengguna terdaftar di sistem WarungKlik
                </p>
              </div>
              <button type="button" className="category-chip-btn" onClick={loadAdminExtras}>
                <RefreshCw size={14} />
                <span>Segarkan</span>
              </button>
            </div>

            {users.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                Belum ada akun pembeli yang terdaftar.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Nama & Email</th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>No. WhatsApp</th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Alamat</th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", textAlign: "right" }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "1rem" }}>
                          <strong style={{ display: "block", color: "var(--text-main)" }}>{u.name}</strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</span>
                        </td>
                        <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{u.phone || "-"}</td>
                        <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{u.address || "-"}</td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="category-chip-btn"
                              style={{ padding: "0.4rem 0.75rem", fontSize: "0.8125rem" }}
                              title="Edit Data / Reset Password User"
                            >
                              <Edit size={14} />
                              <span>Edit / Reset Password</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="category-chip-btn"
                              style={{ padding: "0.4rem 0.75rem", fontSize: "0.8125rem", color: "var(--danger)", borderColor: "#fecaca" }}
                            >
                              <Trash2 size={14} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PENGATURAN TOKO & PROFIL ADMIN */}
        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {/* KARTU 1: PENGATURAN PROFIL & WHATSAPP TOKO */}
            <div
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-card)",
                padding: "1.75rem",
              }}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.25rem" }}>
                  Pengaturan Profil & WhatsApp Toko
                </h1>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Konfigurasi disimpan di tabel SQL settings. Digunakan untuk redirect WhatsApp pesanan pelanggan.
                </p>
              </div>

              <form onSubmit={handleSaveStoreSettings} style={{ display: "flex", flexDirection: "column", gap: "1.15rem", maxWidth: "680px" }}>
                <div className="form-field">
                  <label className="field-label">Nama Bisnis / Toko</label>
                  <input
                    type="text"
                    required
                    className="figma-input"
                    placeholder="Toko Berkah Nusantara"
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Tagline Toko</label>
                  <input
                    type="text"
                    required
                    className="figma-input"
                    placeholder="Kuliner Lezat & Segar Siap Antar Setiap Hari"
                    value={storeForm.tagline}
                    onChange={(e) => setStoreForm({ ...storeForm, tagline: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">
                    Nomor WhatsApp Tujuan (Gunakan kode negara, cth: 6281234567890)
                  </label>
                  <input
                    type="text"
                    required
                    className="figma-input"
                    placeholder="6281234567890"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
                    Nomor ini yang akan menerima chat otomatis saat pelanggan mengklik "Kirim Pesanan ke WhatsApp".
                  </span>
                </div>

                <div className="form-field">
                  <label className="field-label">Alamat Toko</label>
                  <textarea
                    rows={2}
                    required
                    className="figma-textarea"
                    placeholder="Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="btn-whatsapp-order"
                    style={{ width: "auto", margin: 0, padding: "0.65rem 1.5rem" }}
                    disabled={isSavingStore}
                  >
                    <Check size={16} />
                    <span>{isSavingStore ? "Menyimpan..." : "Simpan Pengaturan Toko"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* KARTU 2: EDIT PROFIL & KEAMANAN ADMIN */}
            <div
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-card)",
                padding: "1.75rem",
              }}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.25rem" }}>
                  Edit Profil & Keamanan Admin
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Perbarui Nama Pengguna Admin, Email Login, serta Password Admin utama Anda.
                </p>
              </div>

              <form onSubmit={handleSaveAdminProfile} style={{ display: "flex", flexDirection: "column", gap: "1.15rem", maxWidth: "680px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-field">
                    <label className="field-label">Nama Pengguna Admin</label>
                    <input
                      type="text"
                      required
                      className="figma-input"
                      placeholder="Nama Admin..."
                      value={adminForm.name}
                      onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Email Admin</label>
                    <input
                      type="email"
                      required
                      className="figma-input"
                      placeholder="admin@warungklik.com"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="field-label">Password Admin Baru (Opsional)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      className="figma-input"
                      style={{ paddingRight: "2.6rem" }}
                      placeholder="Kosongkan jika tidak ingin mengubah password admin..."
                      value={adminForm.newPassword}
                      onChange={(e) => setAdminForm({ ...adminForm, newPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword((prev) => !prev)}
                      aria-label={showAdminPassword ? "Sembunyikan password" : "Lihat password"}
                      title={showAdminPassword ? "Sembunyikan password" : "Lihat password"}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: "2px",
                      }}
                    >
                      {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
                    Minimal 6 karakter jika ingin mengganti password login Admin.
                  </span>
                </div>

                <div>
                  <button
                    type="submit"
                    className="btn-whatsapp-order"
                    style={{ width: "auto", margin: 0, padding: "0.65rem 1.5rem" }}
                    disabled={isSavingAdmin}
                  >
                    <Lock size={16} />
                    <span>{isSavingAdmin ? "Menyimpan..." : "Simpan Profil Admin"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL EDIT / RESET PASSWORD USER OLEH ADMIN */}
      {editingUser && (
        <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
          <div
            className="order-modal-card"
            style={{ maxWidth: "520px", gridTemplateColumns: "1fr", padding: "2rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Edit Akun & Reset Password User
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Perbarui informasi pelanggan atau atur ulang password baru.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUserByAdmin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-field">
                <label className="field-label">Nama Lengkap User</label>
                <input
                  type="text"
                  required
                  className="figma-input"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                <div className="form-field">
                  <label className="field-label">Email User</label>
                  <input
                    type="email"
                    required
                    className="figma-input"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">No. WhatsApp</label>
                  <input
                    type="text"
                    className="figma-input"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="field-label">Alamat Pengiriman</label>
                <input
                  type="text"
                  className="figma-input"
                  value={userForm.address}
                  onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Reset Password Baru (Opsional)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showUserResetPassword ? "text" : "password"}
                    className="figma-input"
                    style={{ paddingRight: "2.6rem" }}
                    placeholder="Ketik password baru (min. 6 karakter) jika user lupa password..."
                    value={userForm.newPassword}
                    onChange={(e) => setUserForm({ ...userForm, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserResetPassword((prev) => !prev)}
                    aria-label={showUserResetPassword ? "Sembunyikan password" : "Lihat password"}
                    title={showUserResetPassword ? "Sembunyikan password" : "Lihat password"}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: "2px",
                    }}
                  >
                    {showUserResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="category-chip-btn"
                  onClick={() => setEditingUser(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-whatsapp-order"
                  style={{ width: "auto", margin: 0, padding: "0.65rem 1.4rem" }}
                  disabled={isSavingUser}
                >
                  <Check size={16} />
                  <span>{isSavingUser ? "Menyimpan..." : "Simpan Perubahan User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH / EDIT MENU DENGAN REAL FILE UPLOAD */}
      {isProductModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div
            className="order-modal-card"
            style={{ maxWidth: "600px", gridTemplateColumns: "1fr", maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)" }}>
                    {editingProduct ? "Edit Menu Makanan" : "Tambah Menu Baru"}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    Lengkapi informasi menu untuk ditampilkan di katalog pembeli
                  </p>
                </div>
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  onClick={() => setIsProductModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
                {/* File Upload Area with Live Preview */}
                <div className="form-field">
                  <label className="field-label">Foto Menu Makanan</label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif, .jfif"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: "2px dashed var(--border-color)",
                      borderRadius: "var(--radius-input)",
                      padding: "1rem",
                      textAlign: "center",
                      cursor: "pointer",
                      backgroundColor: "var(--bg-page)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.75rem",
                      transition: "border-color var(--transition-fast)",
                    }}
                  >
                    {previewUrl ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", width: "100%" }}>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "var(--radius-sm)",
                            objectFit: "cover",
                          }}
                        />
                        <div style={{ textAlign: "left", flex: 1 }}>
                          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-main)", display: "block" }}>
                            {selectedFile ? selectedFile.name : "Foto Saat Ini"}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600 }}>
                            Klik untuk mengganti foto
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: "var(--primary-soft)",
                            color: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Upload size={20} />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-main)", display: "block" }}>
                            Klik untuk memilih foto dari galeri / komputer
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Format: JPG, JPEG, PNG, WEBP, AVIF, GIF (Maksimal 10 MB)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label className="field-label">Nama Menu</label>
                  <input
                    type="text"
                    required
                    className="figma-input"
                    placeholder="Contoh: Crispy Avocado Bowl"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-field">
                    <label className="field-label">Kategori</label>
                    <select
                      className="figma-input"
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="field-label">Harga (Rupiah)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="figma-input"
                      placeholder="25000"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="field-label">Deskripsi & Komposisi Menu</label>
                  <textarea
                    rows={2}
                    className="figma-textarea"
                    placeholder="Bahan segar, rempah pilihan..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Status Ketersediaan</label>
                  <select
                    className="figma-input"
                    value={productForm.stockStatus}
                    onChange={(e) => setProductForm({ ...productForm, stockStatus: e.target.value })}
                  >
                    <option value="Tersedia">Tersedia (Bisa dipesan)</option>
                    <option value="Habis">Habis (Stok kosong)</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="category-chip-btn"
                    onClick={() => setIsProductModalOpen(false)}
                    disabled={isSavingProduct}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-whatsapp-order"
                    style={{ width: "auto", margin: 0, padding: "0.65rem 1.5rem" }}
                    disabled={isSavingProduct}
                  >
                    {isSavingProduct ? "Menyimpan..." : editingProduct ? "Simpan Perubahan" : "Simpan Menu Baru"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI HAPUS */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div
            className="order-modal-card"
            style={{ maxWidth: "440px", gridTemplateColumns: "1fr", padding: "2rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "var(--danger-bg)",
                  color: "var(--danger)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                Konfirmasi Hapus {deleteConfirm.type === "product" ? "Menu" : "Kategori"}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Apakah Boss yakin ingin menghapus{" "}
                <strong style={{ color: "var(--text-main)" }}>"{deleteConfirm.item?.name}"</strong>? Data ini akan
                dihapus secara permanen dari katalog toko.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="category-chip-btn"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setDeleteConfirm(null)}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--danger)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "var(--radius-button)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={16} />
                <span>Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
