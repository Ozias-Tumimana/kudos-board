import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

// View a card and its comments, and add new ones (stretch: comments).
// Owns the comment list it loads on open plus the add-comment form fields.
export default function CommentModal({ isOpen, onClose, card }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load the card's comments whenever the modal opens for a card. Like the pages
  // in this app, the effect intentionally drives loading/error state from an async
  // fetch (same documented pattern as BoardPage/HomePage).
  useEffect(() => {
    if (!isOpen || !card) return undefined;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setFormError('');
    api
      .getComments(card.id)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch((err) => {
        if (!cancelled) setFormError(err.message || 'Could not load comments.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, card]);

  function close() {
    setContent('');
    setAuthor('');
    setComments([]);
    setFormError('');
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return setFormError('Comment message is required.');
    setSubmitting(true);
    setFormError('');
    try {
      const created = await api.addComment(card.id, {
        content: content.trim(),
        // Logged-in users comment under their username; guests may name themselves.
        author: user ? user.username : author,
      });
      setComments((prev) => [...prev, created]);
      setContent('');
      setAuthor('');
    } catch (err) {
      setFormError(err.message || 'Could not add comment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!card) return null;

  return (
    <Modal isOpen={isOpen} onClose={close} title="Card & Comments">
      <div className="comment-card-preview">
        <img src={card.gifUrl} alt="" className="comment-card-gif" />
        <p className="card-message">{card.message}</p>
        {card.author && <p className="card-author">— {card.author}</p>}
      </div>

      <h3 className="comment-heading">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {loading ? (
        <p className="status">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="empty-state">No comments yet. Be the first!</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <p className="comment-body">{c.content}</p>
              {c.author && <span className="comment-author">— {c.author}</span>}
            </li>
          ))}
        </ul>
      )}

      <form className="form comment-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Add a comment *</span>
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment…"
          />
        </label>

        {!user && (
          <label className="field">
            <span>Author</span>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Optional"
            />
          </label>
        )}

        {formError && <p className="form-error">{formError}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
