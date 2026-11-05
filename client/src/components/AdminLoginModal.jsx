import React, { useState, useEffect } from "react";
import { Lock, X, User, LogOut, Check, Store } from "./Icons.jsx";
import {
  loginAdmin,
  registerUser,
  updateUserProfile,
  setAuthToken,
} from "../services/api.js";

export function AdminLoginModal({
  isOpen,
  onClose,
  onLogin,
  currentUser,
  onLogout,
  onOpenAdminConsole,
}) {
  const [authTab, setAuthTab] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
      setAddress(currentUser.address || "");
      setErrorMsg("");
      setSuccessMsg("");
    } else if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      if (authTab === "login") {
        const res = await loginAdmin(email, password);
        if (res.success && res.token) {
          setAuthToken(res.token);
          onLogin(res.user);
          onClose();
        } else {
          setErrorMsg(res.message || "Email atau password salah");
        }
      } else {
        const res = await registerUser({
          name,
          email,
          password,
          phone,
          address,
        });
        if (res.success && res.token) {
          setAuthToken(res.token);
          onLogin(res.user);
          onClose();
        } else {
          setErrorMsg(res.message || "Gagal mendaftarkan akun");
        }
      }
    } catch {
      setErrorMsg("Gagal terhubung ke server backend");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await updateUserProfile({ name, phone, address });
      if (res.success && res.data) {
        onLogin(res.data);
        setSuccessMsg("Profil akun berhasil diperbarui!");
      } else {
        setErrorMsg(res.message || "Gagal memperbarui profil");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan saat menyimpan profil");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-login-card" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img
              src="/favicon-warungklik.png"
              alt="WarungKlik"
              style={{
                width: "38px",
                height: "38px",
                objectFit: "contain",
              }}
            />
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-main)" }}>
                {currentUser
                  ? "Profil Akun"
                  : authTab === "login"
                  ? "Masuk Akun"
                  : "Buat Akun Baru"}
              </h3>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                WarungKlik Account
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* IF USER IS ALREADY LOGGED IN -> SHOW PROFILE & LOGOUT */}
        {currentUser ? (
          <div>
            {successMsg && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--success-bg)",
                  border: "1px solid #bbf7d0",
                  color: "var(--success)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8125rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Check size={15} />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--danger-bg)",
                  border: "1px solid #fecaca",
                  color: "var(--danger)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8125rem",
                  marginBottom: "1rem",
                }}
              >
                {errorMsg}
              </div>
            )}

            <form
              onSubmit={handleSaveProfile}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="form-field">
                <label className="field-label">Email Terdaftar</label>
                <input
                  type="email"
                  disabled
                  className="figma-input"
                  value={currentUser.email || ""}
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="figma-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {currentUser.role !== "admin" && (
                <>
                  <div className="form-field">
                    <label className="field-label">Nomor WhatsApp</label>
                    <input
                      type="text"
                      className="figma-input"
                      placeholder="0812xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Alamat Pengiriman Utama</label>
                    <textarea
                      rows={2}
                      className="figma-textarea"
                      placeholder="Jalan, nomor rumah, patokan..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.5rem" }}>
                {currentUser.role === "admin" ? (
                  <button
                    type="button"
                    className="btn-whatsapp-order"
                    onClick={() => {
                      onClose();
                      if (onOpenAdminConsole) onOpenAdminConsole();
                    }}
                  >
                    <Store size={16} />
                    <span>Buka Admin Console</span>
                  </button>
                ) : (
                  <button type="submit" className="btn-whatsapp-order" disabled={isSubmitting}>
                    <Check size={16} />
                    <span>{isSubmitting ? "Menyimpan..." : "Simpan Profil"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onLogout) onLogout();
                    onClose();
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--danger-bg)",
                    color: "var(--danger)",
                    border: "1px solid #fecaca",
                    borderRadius: "var(--radius-button)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  <LogOut size={16} />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* IF NOT LOGGED IN -> SHOW LOGIN / REGISTER TABS */
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                backgroundColor: "var(--bg-muted)",
                padding: "0.3rem",
                borderRadius: "var(--radius-input)",
                marginBottom: "1.25rem",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthTab("login");
                  setErrorMsg("");
                }}
                style={{
                  padding: "0.55rem",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  backgroundColor: authTab === "login" ? "var(--bg-card)" : "transparent",
                  color: authTab === "login" ? "var(--text-main)" : "var(--text-secondary)",
                }}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("register");
                  setErrorMsg("");
                }}
                style={{
                  padding: "0.55rem",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  backgroundColor: authTab === "register" ? "var(--bg-card)" : "transparent",
                  color: authTab === "register" ? "var(--text-main)" : "var(--text-secondary)",
                }}
              >
                Daftar Akun
              </button>
            </div>

            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginBottom: "1.25rem",
                lineHeight: 1.5,
              }}
            >
              {authTab === "login"
                ? "Masuk untuk mengakses menu favorit, keranjang pesanan, riwayat transaksi, atau ruang pengelola."
                : "Daftar akun pembeli untuk menyimpan menu favorit, keranjang belanja, dan mempercepat pemesanan."}
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}
            >
              {errorMsg && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--danger-bg)",
                    border: "1px solid #fecaca",
                    color: "var(--danger)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8125rem",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {authTab === "register" && (
                <div className="form-field">
                  <label className="field-label" htmlFor="reg-name">
                    Nama Lengkap
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    className="figma-input"
                    placeholder="Contoh: Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="form-field">
                <label className="field-label" htmlFor="auth-email">
                  Alamat Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  className="figma-input"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {authTab === "register" && (
                <>
                  <div className="form-field">
                    <label className="field-label" htmlFor="reg-phone">
                      Nomor WhatsApp
                    </label>
                    <input
                      id="reg-phone"
                      type="text"
                      required
                      className="figma-input"
                      placeholder="0812xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label" htmlFor="reg-address">
                      Alamat Pengiriman (Opsional)
                    </label>
                    <input
                      id="reg-address"
                      type="text"
                      className="figma-input"
                      placeholder="Jalan, nomor rumah, kecamatan..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-field">
                <label className="field-label" htmlFor="auth-password">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  className="figma-input"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-whatsapp-order"
                style={{ marginTop: "0.35rem" }}
                disabled={isSubmitting}
              >
                {authTab === "login" ? <Lock size={16} /> : <User size={16} />}
                <span>
                  {isSubmitting
                    ? "Memproses..."
                    : authTab === "login"
                    ? "Masuk Sekarang"
                    : "Buat Akun Pembeli"}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLoginModal;
