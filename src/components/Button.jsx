// src/components/Button.jsx

import { Link } from "react-router-dom";

export default function Button({ children, variant = "primary", to, onClick, className = "" }) {
  const baseClasses = "btn";
  const variantClasses = variant === "primary" ? "btn-primary" : "btn-secondary";
  const fullClasses = `${baseClasses} ${variantClasses} ${className}`;

  if (to) {
    return (
      <Link to={to} className={fullClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={fullClasses} onClick={onClick}>
      {children}
    </button>
  );
}