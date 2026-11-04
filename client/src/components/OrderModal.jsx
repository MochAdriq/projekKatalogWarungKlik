import React, { useState } from "react";
import { X, Plus, Minus, ShoppingBag } from "./Icons.jsx";

export function OrderModal({ product, storeSetting, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

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

  const handleSendToWhatsApp = (e) => {
    e.preventDefault();

    const phone = storeSetting?.phone || "0895338977816";
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }

    const message = `Halo ${storeSetting?.storeName || "WarungKlik"}, saya ingin memesan:
- Menu: ${product.name}
- Jumlah: ${quantity} porsi
- Total: ${formatRupiah(totalPrice)}
${customerName ? `- Nama Pemesan: ${customerName}` : ""}
${notes ? `- Catatan: ${notes}` : ""}

Mohon konfirmasi pesanan saya. Terima kasih!`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="order-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Left Column: Food Photography & Description */}
        <div className="order-modal-media">
          {imageSrc ? (
            <img
              src={
                imageSrc.startsWith("http") || imageSrc.startsWith("/")
                  ? imageSrc
                  : `/${imageSrc}`
              }
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
        </div>

        {/* Right Column: Order Form (Figma: Order details) */}
        <div className="order-modal-form-col">
          <div>
            <div className="order-modal-header">
              <div>
                <h3 className="order-modal-title">{product.name}</h3>
                <p className="order-modal-subtitle">{formatRupiah(product.price)} / porsi</p>
              </div>
              <button
                type="button"
                className="order-modal-close"
                onClick={onClose}
                aria-label="Tutup popup"
              >
                <X size={20} />
              </button>
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
                  className="figma-input"
                  placeholder="Nama Anda..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
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

              <div>
                <button type="submit" className="btn-whatsapp-order">
                  <ShoppingBag size={18} />
                  <span>Order via WhatsApp</span>
                </button>
                <p className="order-reassurance-text">
                  We’ll confirm your order & delivery in chat.
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
