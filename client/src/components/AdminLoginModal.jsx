import React, { useState, useEffect } from "react";
import { Lock, X, User, LogOut, Check, Store, Eye, EyeOff } from "./Icons.jsx";
import {
  loginAdmin,
  registerUser,
  updateUserProfile,
  updateAdminProfile,
  setAuthToken,
} from "../services/api.js";

export function AdminLoginModal({
  isOpen,
  onClose,
  onLogin,
  currentUser,
  storeSetting,
  onLogout,
  onOpenAdminConsole,
}) {
  const [authTab, setAuthTab] = useState("login"); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setAddress(currentUser.address || "");
      setNewPassword("");
      setErrorMsg("");
      setSuccessMsg("");
    } else if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleForgotWhatsApp = (e) => {
    e.preventDefault();
    const adminPhone = storeSetting?.phone || "6281234567890";
    let cleanPhone = adminPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }

    const storeName = storeSetting?.storeName || "WarungKlik";
    const text = `Halo Admin ${storeName}, saya meminta bantuan Reset Password untuk akun pelanggan saya:\n- Email Akun: ${email.trim()}\n${
      name.trim() ? `- Nama Akun: ${name.trim()}\n` : ""
    }\nMohon bantuannya untuk mengatur ulang password akun saya. Terima kasih!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
    onClose();
  };

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
      let res;
      if (currentUser?.role === "admin") {
        const payload = { name, email };
        if (newPassword.trim()) payload.newPassword = newPassword.trim();
        res = await updateAdminProfile(payload);
      } else {
        const payload = { name, phone, address };
        if (newPassword.trim()) payload.newPassword = newPassword.trim();
        res = await updateUserProfile(payload);
      }

      if (res.success && res.data) {
        onLogin(res.data);
        setNewPassword("");
        setSuccessMsg(
          newPassword.trim()
            ? "Profil dan password berhasil diperbarui!"
            : "Profil akun berhasil diperbarui!"
        );
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
                  disabled={currentUser.role !== "admin"}
                  required
                  className="figma-input"
                  value={currentUser.role === "admin" ? email : currentUser.email || ""}
                  onChange={(e) => setEmail(e.target.value)}
                  style={
                    currentUser.role !== "admin"
                      ? { opacity: 0.7, cursor: "not-allowed" }
                      : {}
                  }
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

              <div className="form-field">
                <label className="field-label">Ganti Password Baru (Opsional)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="figma-input"
                    style={{ paddingRight: "2.6rem" }}
                    placeholder="Kosongkan jika tidak ingin ganti password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? "Sembunyikan password" : "Lihat password"}
                    title={showNewPassword ? "Sembunyikan password" : "Lihat password"}
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
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn-whatsapp-order" disabled={isSubmitting}>
                  <Check size={16} />
                  <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan Profil"}</span>
                </button>

                {currentUser.role === "admin" && (
                  <button
                    type="button"
                    className="category-chip-btn"
                    style={{ width: "100%", justifyContent: "center", padding: "0.7rem 1rem" }}
                    onClick={() => {
                      onClose();
                      if (onOpenAdminConsole) onOpenAdminConsole();
                    }}
                  >
                    <Store size={16} />
                    <span>Buka Admin Console</span>
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

            {authTab === "forgot" ? (
              <form
                onSubmit={handleForgotWhatsApp}
                style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}
              >
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Masukkan email akun Anda. Sistem akan mengarahkan Anda ke WhatsApp Admin Toko untuk meminta reset password secara langsung.
                </p>

                <div className="form-field">
                  <label className="field-label" htmlFor="forgot-email">
                    Email Akun Terdaftar
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    className="figma-input"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="forgot-name">
                    Nama Pengguna (Opsional)
                  </label>
                  <input
                    id="forgot-name"
                    type="text"
                    className="figma-input"
                    placeholder="Nama lengkap Anda..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-whatsapp-order" style={{ marginTop: "0.35rem" }}>
                  <Lock size={16} />
                  <span>Hubungi WhatsApp Admin (Reset Password)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthTab("login")}
                  className="category-chip-btn"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span>Kembali ke Halaman Masuk</span>
                </button>
              </form>
            ) : (
              <>
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label className="field-label" htmlFor="auth-password">
                        Password
                      </label>
                      {authTab === "login" && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthTab("forgot");
                            setErrorMsg("");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--primary)",
                            cursor: "pointer",
                          }}
                        >
                          Lupa Password?
                        </button>
                      )}
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        required
                        className="figma-input"
                        style={{ paddingRight: "2.6rem" }}
                        placeholder="Minimal 6 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                        title={showPassword ? "Sembunyikan password" : "Lihat password"}
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
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLoginModal;
