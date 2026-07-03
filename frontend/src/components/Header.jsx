import { Link } from "react-router-dom";
import "./Header.css";

export default function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="site-header__brand">
        <span className="site-header__mark" aria-hidden="true">
          48<span className="site-header__mark-accent">29</span>
        </span>
        <span className="site-header__name">Cloud Print Kiosk</span>
      </Link>
    </header>
  );
}
