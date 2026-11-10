import React, { useState, useEffect } from "react";
import { X, Plus, Minus, ShoppingBag } from "./Icons.jsx";
import { createOrder } from "../services/api.js";

export function OrderModal({
  product,
  storeSetting,
  currentUser,
  onAddToBag,
  onOrderCreated,
  onClose,
}) {
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name || "");
      setCustomerPhone(currentUser.phone || "");
      setCustomerAddress(currentUser.address || "");
    }
  }, [currentUser, product]);

  if (!product) return null;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalPrice = (product.price || 0) * quantity;
  const imageSrc = product.imageurl || product.imageUrl;

  const handleSendToWhatsApp = async (e) => {
    e.preventDefault();
    setOrderError("");
    setIsOrdering(true);

    try {
      // Klien hanya mengirim productId + quantity; harga & total dihitung server.
      const orderPayload = {
        customerName: customerName.trim() || currentUser?.name || "Pelanggan WarungKlik",
        customerPhone: customerPhone.trim() || currentUser?.phone || "",
        customerAddress: customerAddress.trim() || currentUser?.address || "",
        items: [{ productId: product.id || product._id, quantity }],
        notes: notes.trim(),
      };

      let orderRes;
      try {
        orderRes = await createOrder(orderPayload);
      } catch {
        setOrderError("Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.");
        return;
      }

      if (!orderRes?.success || !orderRes?.data) {
        setOrderError(orderRes?.message || "Pesanan gagal dicatat. Silakan coba lagi.");
        return;
      }

      const savedOrder = orderRes.data;
      const orderId = savedOrder.id || "";
      const confirmedTotal = savedOrder.totalPrice ?? totalPrice;

      if (onOrderCreated) onOrderCreated();

      const phone = storeSetting?.phone || "";
      let cleanPhone = phone.replace(/[^0-9]/g, "");
      if (cleanPhone.startsWith("0")) {
        cleanPhone = "62" + cleanPhone.slice(1);
      }

      if (!cleanPhone) {
        setOrderError("Nomor WhatsApp toko belum diatur. Pesanan Anda sudah tercatat, silakan hubungi toko langsung.");
        return;
      }

      const message = `Halo ${storeSetting?.storeName || "WarungKlik"}, saya ingin memesan${orderId ? ` (${orderId})` : ""}:
- Menu: ${product.name}
- Jumlah: ${quantity} porsi
- Total: ${formatRupiah(confirmedTotal)}
- Nama Pemesan: ${orderPayload.customerName}
${orderPayload.customerPhone ? `- No. WA: ${orderPayload.customerPhone}` : ""}
${orderPayload.customerAddress ? `- Alamat: ${orderPayload.customerAddress}` : ""}
${notes ? `- Catatan: ${notes}` : ""}

Mohon konfirmasi pesanan saya. Terima kasih!`;

      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      const win = window.open(waUrl, "_blank");
      if (!win) {
        window.location.href = waUrl;
      }
      onClose();
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="order-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Landscape Food Photography */}
        <div className="order-modal-media">
          {imageSrc ? (
            <img
              src={
                imageSrc.startsWith("http") || imageSrc.startsWith("/")
                  ? imageSrc
                  : `/${imageSrc}`
              }
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <ShoppingBag size={48} />
            </div>
          )}

          <button
            type="button"
            className="order-modal-close-floating"
            onClick={onClose}
            aria-label="Tutup popup"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Bottom Section: Product Details & Order Form */}
        <div className="order-modal-form-col">
          <div>
            <div className="order-modal-header">
              <div>
                <h3 className="order-modal-title">{product.name}</h3>
                <p className="order-modal-subtitle">{formatRupiah(product.price)} / porsi</p>
                {product.description && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      marginTop: "0.4rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {product.description}
                  </p>
                )}
              </div>
            </div>

            <form onSubmit={handleSendToWhatsApp} className="order-form-body">
              <div className="form-field">
                <label className="field-label">Jumlah Porsi</label>
                <div className="qty-counter">
                  <button
                    type="button"
                    className="qty-counter-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Kurangi porsi"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="qty-counter-val">{quantity}</span>
                  <button
                    type="button"
                    className="qty-counter-btn"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Tambah porsi"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label className="field-label" htmlFor="customer-name">
                  Nama Pemesan
                </label>
                <input
                  id="customer-name"
                  type="text"
                  required
                  className="figma-input"
                  placeholder="Nama Anda..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="field-label" htmlFor="customer-address">
                  Alamat Pengiriman (Opsional)
                </label>
                <input
                  id="customer-address"
                  type="text"
                  className="figma-input"
                  placeholder="Alamat lengkap..."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="field-label" htmlFor="order-notes">
                  Catatan Khusus (Opsional)
                </label>
                <textarea
                  id="order-notes"
                  className="figma-textarea"
                  placeholder="Contoh: Kurangi es, tanpa sambal..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="order-total-bar">
                <span>Subtotal Pembayaran</span>
                <strong>{formatRupiah(totalPrice)}</strong>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {orderError && (
                  <div
                    role="alert"
                    style={{
                      padding: "0.7rem 0.9rem",
                      backgroundColor: "var(--danger-bg)",
                      border: "1px solid #fecaca",
                      color: "var(--danger)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {orderError}
                  </div>
                )}
                {onAddToBag && (
                  <button
                    type="button"
                    className="category-chip-btn"
                    style={{ width: "100%", justifyContent: "center", padding: "0.75rem 1rem" }}
                    onClick={() => {
                      onAddToBag(product, quantity);
                      onClose();
                    }}
                  >
                    <Plus size={16} />
                    <span>Tambah ke My Bag ({quantity})</span>
                  </button>
                )}

                <button type="submit" className="btn-whatsapp-order" disabled={isOrdering}>
                  <ShoppingBag size={18} />
                  <span>{isOrdering ? "Memproses..." : "Order via WhatsApp"}</span>
                </button>
                <p className="order-reassurance-text">
                  Pesanan otomatis tercatat di riwayat & diteruskan ke WhatsApp.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderModal;
