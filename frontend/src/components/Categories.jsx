// src/components/Categories.jsx
import { Link } from "react-router-dom";

export default function Categories() {
  const categories = [
    { name: "Women's Sandals", slug: "women", img: "/img/womenshoes/womencategoryimage.png" },
    { name: "Men's Sandals", slug: "men", img: "/img/menshoes/Malecategoryimage.png" },
    { name: "Kids' Sandals", slug: "kids", img: "/img/kidsshoes/kidscategoryimage.jpeg" },
    { name: "Unisex Sandals", slug: "unisex", img: "/img/unisexshoes/unisexcategoryimage.png" },
  ];

  return (
    <section id="categories" className="section-p1">
      <h1 className="section-title">Shop by Category</h1>
      <div className="categories-grid">
        {categories.map((cat) => (
          <Link key={cat.slug} to={`/shop?category=${cat.slug}`} className="category-card">
            <div className="card-image">
              <img src={cat.img} alt={cat.name} />
            </div>
            <h3>{cat.name}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
