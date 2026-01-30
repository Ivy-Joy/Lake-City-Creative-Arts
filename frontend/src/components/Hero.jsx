// src/components/Hero.jsx
import { Link } from "react-router-dom";

export default function Hero({ title, subtitle, showButton }) {
  return (
    <section id="hero">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {showButton && (
          <Link to="/shop" className="btn">
            Shop Now
          </Link>
        )}
      </div>
    </section>
  );
}
