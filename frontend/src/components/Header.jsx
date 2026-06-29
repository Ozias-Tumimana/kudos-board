import { Link } from 'react-router-dom';

// Site title; clicking the logo returns to the home page.
export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="Kudos Board home">
          <span className="logo-mark" aria-hidden="true">★</span>
          <span className="logo-text">Kudos Board</span>
        </Link>
      </div>
    </header>
  );
}
