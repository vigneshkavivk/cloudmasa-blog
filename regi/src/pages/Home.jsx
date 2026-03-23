// src/pages/Home.jsx

import { useState } from "react";
import blogs from "../data/blogs.json";
import BlogCard from "../components/BlogCard";
import Hero from "../components/Hero";
import SectionTitle from "../components/SectionTitle";

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Get unique categories
  const categories = [...new Set(blogs.map(blog => blog.category))];

  // Filter blogs
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(search.toLowerCase()) ||
                          blog.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? blog.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Get featured articles (first 2)
  const featuredArticles = blogs.slice(0, 2);

  // Get recent articles (next 3)
  const recentArticles = blogs.slice(2, 5);

  return (
    <div className="container">
      <Hero />

      {/* Featured Articles */}
      <SectionTitle
        title="Featured Articles"
        subtitle="Hand-picked content from our engineering team"
        viewAll="/all-posts"
      />
      <div className="blog-grid">
        {featuredArticles.map(blog => (
          <BlogCard key={blog.id} blog={blog} featured={true} />
        ))}
      </div>

      {/* Recent Articles */}
      <SectionTitle
        title="Recent Articles"
        subtitle="Stay updated with our latest engineering insights"
        viewAll="/all-posts"
      />
      <div className="blog-grid">
        {recentArticles.map(blog => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>

      {/* Contribute Section */}
      <div className="contribute">
        <h2>Want to Contribute?</h2>
        <p>
          Join our team of engineers sharing knowledge. Submit your article ideas and help the community grow.
        </p>
        <button className="btn btn-secondary">Submit Article Idea</button>
      </div>
    </div>
  );
}