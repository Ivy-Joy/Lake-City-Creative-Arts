// src/pages/BlogPostPage.jsx
import { useParams, Link } from "react-router-dom";
import blogPosts from "../data/blogPosts";
import MainLayout from "../layouts/MainLayout";
//import NewsLetter from "../components/NewsLetter";

export default function BlogPostPage() {
  const { id } = useParams();
  const post = blogPosts.find((p) => p.id.toString() === id);

  if (!post) return 
      <MainLayout>
        <h2>Blog post not found</h2>;
      </MainLayout>
    

  return (
    <MainLayout>
      <div className="blog-post">
        <Link to="/blog" style={{ color: "#088178" }}>
          ← Back to Blog
        </Link>
        <h1>{post.title}</h1>
        <img
          src={post.image}
          alt={post.title}
          className="blog-post-img"
        />
        <div dangerouslySetInnerHTML={{ __html: post.fullContent }} />
      </div>

      {/* <NewsLetter /> */}
    </MainLayout>
  );
}
