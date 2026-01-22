// src/components/Footer.jsx

import logo from "../assets/images/logo.svg";

export default function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <div>
          <div className="footer-logo">
            <img src={logo} alt="CloudMasa Logo" />
            <h1>CloudMasa</h1>
          </div>
          <p className="footer-desc">
            Empowering engineers with in-depth tutorials, best practices, and insights on DevOps, cloud infrastructure, and modern software development.
          </p>
          <div className="social-icons">
            <a href="#" aria-label="GitHub">🐙</a>
            <a href="#" aria-label="Twitter">🐦</a>
            <a href="#" aria-label="LinkedIn">💼</a>
            <a href="#" aria-label="Email">✉️</a>
          </div>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/all-posts">All Posts</a></li>
            <li><a href="/categories">Categories</a></li>
            <li><a href="/about">About Us</a></li>
          </ul>
        </div>

        <div className="footer-links">
          <h3>Categories</h3>
          <ul>
            <li><a href="#">DevOps</a></li>
            <li><a href="#">Monitoring</a></li>
            <li><a href="#">Kubernetes</a></li>
            <li><a href="#">Cloud</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 CloudMasa. All rights reserved.
        <span style={{ marginLeft: "1rem" }}>
          <a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a>
        </span>
      </div>
    </footer>
  );
}