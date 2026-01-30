// src/components/BestSellers.jsx
import ProductCard from "./ProductCard";
import productsData from "../data/products.json";

export default function BestSellers() {
  const bestSellers = productsData.filter(p => p.bestseller).slice(0, 3);
  return (
    <section id="best-sellers" className="section-p1">
      <h2>Best Sellers</h2>
      <p>Most popular products loved by customers</p>
      <div className="pro-container">
        {bestSellers.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <a className="normal" href="/shop?bestseller=true">View All Best Sellers</a>
      </div>
    </section>
  );
}
