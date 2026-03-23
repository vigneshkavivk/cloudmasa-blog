// src/App.jsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BlogDetail from "./pages/BlogDetail";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <BrowserRouter basename="/">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/all-posts" element={<Home />} />
        <Route path="/categories" element={<Home />} />
        <Route path="/about" element={<Home />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;