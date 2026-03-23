// src/components/SectionTitle.jsx

import { Link } from "react-router-dom";

export default function SectionTitle({ title, subtitle, viewAll }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {viewAll && (
        <Link to={viewAll} className="view-all">
          View All →
        </Link>
      )}
    </div>
  );
}