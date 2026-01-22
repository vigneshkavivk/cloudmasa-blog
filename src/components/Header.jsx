// src/components/Header.jsx

import { useState } from "react";
import logo from "../assets/images/logo.svg";

export default function Header() {
  const [theme, setTheme] = useState("dark");

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <header>
      <div className="logo">
        <img src={logo} alt="CloudMasa Logo" />
        <h1>CloudMasa</h1>
      </div>

      <nav>
        <ul>
          <li><a href="/" className="active">Home</a></li>
          <li><a href="/all-posts">All Posts</a></li>
          <li><a href="/categories">Categories</a></li>
          <li><a href="/about">About</a></li>
        </ul>
      </nav>

      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </header>
  );
}