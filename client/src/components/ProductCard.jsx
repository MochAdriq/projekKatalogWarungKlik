import React, { useState } from "react";
import { Plus, ShoppingBag, Heart, X, Check } from "./Icons.jsx";

export function ProductCard({
  product,
  onSelectProduct,
  onAddToBag,
  isFavorite = false,
  onToggleFavorite,
}) {
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock =
    product.stockStatus === "out_of_stock" ||
    product.stockStatus === "Habis" ||
    product.stock === 0;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const imageSrc = product.imageurl || product.imageUrl;

  return (
    <article className="food-card">
      <div
        className="food-photography"
        onClick={() => !isOutOfStock && onSelectProduct && onSelectProduct(product)}
        style={{ cursor: isOutOfStock ? "default" : "pointer", position: "relative" }}
      >
        {imageSrc ? (
          <img
            src={
              imageSrc.startsWith("http") || imageSrc.startsWith("/")
                ? imageSrc
                : `/${imageSrc}`
            }
            alt={product.name}
            className="dish-image"
            loading="lazy"
          />
        ) : (
          <div className="dish-image-fallback">
            <ShoppingBag size={34} />
          </div>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product);
            }}
            title={isFavorite ? "Hapus dari Favorit" : "Simpan ke Favorit"}
            aria-label="Simpan ke Favorit"
            style={{
              position: "absolute",
              top: "0.75rem",
              right: "0.75rem",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.92)",
              border: "1px solid var(--border-color)",
              color: isFavorite ? "#dc2626" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Heart
              size={16}
              style={{
                fill: isFavorite ? "#dc2626" : "none",
              }}
            />
          </button>
        )}
      </div>

      <div className="food-details">
        <div>
          {product.categoryName && (
            <div
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--primary)",
                marginBottom: "0.2rem",
              }}
            >
              {product.categoryName}
            </div>
          )}
          <h3
            className="dish-title"
            onClick={() => !isOutOfStock && onSelectProduct && onSelectProduct(product)}
            style={{ cursor: isOutOfStock ? "default" : "pointer" }}
          >
            {product.name}
          </h3>
          <p className="dish-ingredients">
            {product.description || "Freshly prepared with authentic ingredients"}
          </p>
        </div>

        <div className="price-and-add-row">
          <span className="dish-price">{formatRupiah(product.price)}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <button
              type="button"
              className="add-to-bag-btn"
              style={
                justAdded
                  ? { backgroundColor: "var(--success)", transform: "scale(1.06)" }
                  : undefined
              }
              onClick={() => {
                if (onAddToBag) {
                  onAddToBag(product);
                  setJustAdded(true);
                  setTimeout(() => setJustAdded(false), 1200);
                } else if (onSelectProduct) {
                  onSelectProduct(product);
                }
              }}
              disabled={isOutOfStock}
              title={isOutOfStock ? "Menu Habis" : justAdded ? "Berhasil masuk My Bag" : "Tambah ke My Bag"}
              aria-label={`Tambah ${product.name} ke keranjang`}
            >
              {isOutOfStock ? <X size={15} /> : justAdded ? <Check size={18} /> : <Plus size={18} />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
