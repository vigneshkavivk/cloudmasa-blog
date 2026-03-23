// src/components/Hero.jsx

import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="hero">
      <div className="tag">✨ Engineering Excellence</div>
      <h1>CloudMasa Engineering Blog</h1>
      <p>
        Deep-dive tutorials on DevOps, cloud infrastructure, monitoring, and modern software engineering. Written by engineers, for engineers.
      </p>
      <div className="buttons">
        <Link to="/all-posts" className="btn btn-primary">
          Explore Articles →
        </Link>
        <Link to="/categories" className="btn btn-secondary">
          Browse Categories
        </Link>
      </div>
    </section>
  );
}