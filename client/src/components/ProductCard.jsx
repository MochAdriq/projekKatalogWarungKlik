import React from "react";
import { Plus, ShoppingBag } from "./Icons.jsx";

export function ProductCard({ product, onSelectProduct }) {
  const isOutOfStock = product.stockStatus === "out_of_stock" || product.stock === 0;

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
      <div className="food-photography">
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
        {product.categoryName && (
          <span className="dish-badge">{product.categoryName}</span>
        )}
      </div>

      <div className="food-details">
        <div>
          <h3 className="dish-title">{product.name}</h3>
          <p className="dish-ingredients">
            {product.description || "Freshly prepared with authentic ingredients"}
          </p>
        </div>

        <div className="price-and-add-row">
          <span className="dish-price">{formatRupiah(product.price)}</span>
          <button
            type="button"
            className="add-to-bag-btn"
            onClick={() => onSelectProduct(product)}
            disabled={isOutOfStock}
            title={isOutOfStock ? "Menu Habis" : "Tambah ke Pesanan"}
            aria-label={`Pesan ${product.name}`}
          >
            {isOutOfStock ? <span style={{ fontSize: "11px" }}>✕</span> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
