// src/components/BlogCard.jsx

import { Link } from "react-router-dom";
import { getReadTime } from "../utils/readTime";

export default function BlogCard({ blog, featured = false }) {
  const readTime = getReadTime(blog.content);

  return (
    <div className="card">
      <div className={`card-image ${featured ? "featured" : ""}`}>
        {featured ? "Featured" : blog.category || "Article"}
      </div>
      <div className="card-content">
        {blog.category && (
          <div className="card-category">{blog.category}</div>
        )}
        <h3>{blog.title}</h3>
        <p>{blog.excerpt}</p>
        <div className="card-meta">
          <span className="author">👤 {blog.author}</span>
          <span className="read-time">⏱️ {readTime}</span>
        </div>
        <Link to={`/blog/${blog.id}`} className="read-more">
          Read Article →
        </Link>
      </div>
    </div>
  );
}