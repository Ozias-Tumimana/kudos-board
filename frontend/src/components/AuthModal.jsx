import { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';

// Login / Signup form (stretch: user accounts). One modal toggles between the two
// modes; on success it closes. Calls AuthContext, which stores the token.
export default function AuthModal({ isOpen, onClose }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setUsername('');
    setPassword('');
    setFormError('');
    setMode('login');
  }

  function close() {
    reset();
    onClose();
  }

  function switchMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return setFormError('Username and password are required.');
    }
    setSubmitting(true);
    setFormError('');
    try {
      const creds = { username: username.trim(), password };
      if (mode === 'login') await login(creds);
      else await signup(creds);
      close();
    } catch (err) {
      setFormError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <Modal isOpen={isOpen} onClose={close} title={isLogin ? 'Log In' : 'Sign Up'}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Username *</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
            autoFocus
            autoComplete="username"
          />
        </label>

        <label className="field">
          <span>Password *</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
        </label>

        {formError && <p className="form-error">{formError}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={switchMode}>
            {isLogin ? 'Need an account? Sign up' : 'Have an account? Log in'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Please wait…' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
