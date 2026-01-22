// src/pages/BlogDetail.jsx

import { useParams } from "react-router-dom";
import blogs from "../data/blogs.json";
import { getReadTime } from "../utils/readTime";

export default function BlogDetail() {
  const { id } = useParams();
  const blog = blogs.find(b => b.id === id);

  if (!blog) {
    return (
      <div className="container">
        <h1>Blog Not Found</h1>
        <p>Sorry, the requested blog post does not exist.</p>
      </div>
    );
  }

  const readTime = getReadTime(blog.content);

  return (
    <div className="container">
      <article className="blog-detail">
        <h1>{blog.title}</h1>
        <div className="card-meta">
          <span className="author">👤 {blog.author}</span>
          <span className="read-time">⏱️ {readTime}</span>
        </div>
        <p>{blog.content}</p>
      </article>
    </div>
  );
}