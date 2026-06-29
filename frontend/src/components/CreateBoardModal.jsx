import { useState } from 'react';
import Modal from './Modal';
import { CATEGORIES } from '../api/client';

const CATEGORY_OPTIONS = [
  { value: 'celebration', label: 'Celebration' },
  { value: 'thank-you', label: 'Thank You' },
  { value: 'inspiration', label: 'Inspiration' },
];

const EMPTY = { title: '', category: '', author: '', imageUrl: '' };

// Form to create a board. Owns its controlled fields + a validation error; hands
// the new board payload up to HomePage via onCreate.
export default function CreateBoardModal({ isOpen, onClose, onCreate }) {
  const [fields, setFields] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function close() {
    setFields(EMPTY);
    setFormError('');
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fields.title.trim()) return setFormError('Title is required.');
    if (!CATEGORIES.includes(fields.category)) {
      return setFormError('Please choose a category.');
    }
    setSubmitting(true);
    setFormError('');
    try {
      await onCreate({
        title: fields.title,
        category: fields.category,
        author: fields.author,
        imageUrl: fields.imageUrl,
      });
      close();
    } catch (err) {
      setFormError(err.message || 'Could not create board.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Create New Board">
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Title *</span>
          <input
            type="text"
            value={fields.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Team Wins This Sprint"
            autoFocus
          />
        </label>

        <label className="field">
          <span>Category *</span>
          <select
            value={fields.category}
            onChange={(e) => update('category', e.target.value)}
          >
            <option value="">Select a category…</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Author</span>
          <input
            type="text"
            value={fields.author}
            onChange={(e) => update('author', e.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className="field">
          <span>Image URL</span>
          <input
            type="url"
            value={fields.imageUrl}
            onChange={(e) => update('imageUrl', e.target.value)}
            placeholder="Optional — a themed placeholder is used if blank"
          />
        </label>

        {formError && <p className="form-error">{formError}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Board'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
