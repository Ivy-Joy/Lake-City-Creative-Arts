// src/components/BlogCard.jsx
import { Link } from "react-router-dom";

export default function BlogCard({ post }) {
  return (
    <div className="blog-box">
      <div className="blog-img">
        <img src={post.image} alt={post.title} />
      </div>
      <div className="blog-details">
        <h3>{post.title}</h3>
        <p>{post.shortDesc}</p>
        <Link to={`/blog/${post.id}`} onClick={() => window.scrollTo({top:0, behavior: "smooth"})}>Read More</Link>
      </div>
    </div>
  );
}
