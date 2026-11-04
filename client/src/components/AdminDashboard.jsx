import React, { useState, useRef } from "react";
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
} from "./Icons.jsx";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStock,
  deleteCategory,
  getAuthToken,
} from "../services/api.js";

export function AdminDashboard({
  products = [],
  categories = [],
  storeSetting,
  adminUser,
  onRefreshData,
  onBackToCatalog,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("products"); // 'products', 'categories'
  const [newCategoryName, setNewCategoryName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Ukuran file foto maksimal 5 MB");
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
          <h2 className="admin-console-brand">Admin Console</h2>

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
                    padding: "0.1rem 0.5rem",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: activeTab === "products" ? "var(--primary)" : "var(--bg-muted)",
                    color: activeTab === "products" ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {products.length}
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
                    padding: "0.1rem 0.5rem",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: activeTab === "categories" ? "var(--primary)" : "var(--bg-muted)",
                    color: activeTab === "categories" ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {categories.length}
                </span>
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
                  {adminUser?.email?.split("@")[0] || "Admin"}
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
            {activeTab === "products" ? "Daftar Menu" : "Kategori Menu"}
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
              ✕
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
              ✕
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
                              <span style={{ fontSize: "10px", opacity: 0.7 }}>⇄</span>
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
      </main>

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
                    accept="image/png, image/jpeg, image/jpg, image/webp"
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
                            Format: JPG, PNG, atau WEBP (Maksimal 5 MB)
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
