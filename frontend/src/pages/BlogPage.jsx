// src/pages/BlogPage.jsx
import blogPosts from "../data/blogPosts";
import MainLayout from "../layouts/MainLayout";
//import NewsLetter from "../components/NewsLetter";
import BlogCard from "../components/BlogCard";

export default function BlogPage() {
  return (
    <MainLayout>
      <section id="blog-header">
        <h2>Read More...</h2>
        <p>Here is where you get all the information about our products.</p>
      </section>

      <section id="blog" className="section-p1">
        <h1>Latest Blog Posts</h1>
        <div id="blog-container">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      {/* <NewsLetter /> */}
    </MainLayout>
  );
}
