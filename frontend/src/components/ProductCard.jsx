// src/components/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
//import "./../styles/ProductCard.css"; // update path if you place file elsewhere

export default function ProductCard({ product }) {
  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((it) => it.id === product.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    // notify other windows/components — Header listens for this
    window.dispatchEvent(new Event("cartChanged"));
    // small visual feedback could be added here (toast), kept minimal for now
  };

  const openProduct = () => {
    // allow parent Link to navigate; for semantic clickable card, we'll rely on Link wrapper
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card" onClick={openProduct} aria-label={`View ${product.name}`}>
      {product.bestseller && <div className="badge">Bestseller</div>}

      <div className="hover-overlay" aria-hidden>
        <button className="icon-btn" title="Add to wishlist" onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* wishlist logic */ }}>
          <i className="fa fa-heart" aria-hidden />
        </button>
        <button className="icon-btn" title="Quick view" onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* quick view modal */ }}>
          <i className="fa fa-eye" aria-hidden />
        </button>
      </div>

      <div className="img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>

      <div className="card-body">
        <div className="category">{product.category?.charAt(0).toUpperCase() + product.category?.slice(1)}</div>
        <h5>{product.name}</h5>
        <div className="rating" aria-hidden>
          {/* Use product.rating if available, else static stars */}
          {Array.from({ length: 4 }).map((_, i) => (
            <i key={i} className="fa fa-star" style={{ opacity: 0.9 }} />
          ))}
        </div>

        <div className="price-row">
          <div className="price">Ksh. {product.price}</div>
          <div className="actions">
            <button
              onClick={addToCart}
              className="cart-btn"
              aria-label={`Add ${product.name} to cart`}
            >
              <i className="fa fa-shopping-cart" aria-hidden /> Add
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
