import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import AuthModal from './AuthModal';

// Site title + theme toggle + auth controls. Clicking the logo returns home.
// Auth UI (stretch): shows Log In / Sign Up when logged out; username + Log Out
// when logged in. The theme toggle (stretch: dark mode) is always present.
export default function Header() {
  const { user, authLoading, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="Kudos Board home">
          <span className="logo-mark" aria-hidden="true">★</span>
          <span className="logo-text">Kudos Board</span>
        </Link>

        <div className="header-actions">
          <ThemeToggle />

          {!authLoading && (
            user ? (
              <>
                <span className="header-user">Hi, {user.username}</span>
                <button type="button" className="btn btn-ghost" onClick={logout}>
                  Log Out
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsAuthOpen(true)}
              >
                Log In / Sign Up
              </button>
            )
          )}
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </header>
  );
}
