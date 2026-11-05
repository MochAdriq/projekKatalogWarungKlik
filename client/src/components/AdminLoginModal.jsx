import React, { useState } from "react";
import { Lock, X, Store } from "./Icons.jsx";
import { loginAdmin, setAuthToken } from "../services/api.js";

export function AdminLoginModal({ isOpen, onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await loginAdmin(email, password);
      if (res.success && res.token) {
        setAuthToken(res.token);
        onLogin(res.user);
        onClose();
      } else {
        setErrorMsg(res.message || "Email atau password salah");
      }
    } catch (err) {
      setErrorMsg("Gagal terhubung ke server backend");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-login-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
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
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-main)" }}>Admin console</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                WarungKlik Workspace
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          Masuk untuk mengelola katalog menu makanan, kategori, dan pengaturan toko Anda.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
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

          <div className="form-field">
            <label className="field-label" htmlFor="admin-email">
              Email Admin
            </label>
            <input
              id="admin-email"
              type="email"
              required
              className="figma-input"
              placeholder="admin@warungklik.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              className="figma-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-whatsapp-order"
            style={{ marginTop: "0.5rem" }}
            disabled={isSubmitting}
          >
            <Lock size={16} />
            <span>{isSubmitting ? "Memverifikasi..." : "Masuk ke Workspace"}</span>
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.45rem",
              marginTop: "0.5rem",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
            }}
          >
            <Lock size={13} />
            <span>Secure access for authorized users only</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginModal;
