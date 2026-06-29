import { useState } from 'react';
import Modal from './Modal';
import { searchGifs, hasGiphyKey } from '../api/giphy';

const EMPTY = { message: '', author: '' };

// Form to create a card. Owns its controlled fields plus the GIPHY search state
// (query, results, selected gif). Hands the new card payload up to BoardPage.
export default function CreateCardModal({ isOpen, onClose, onCreate }) {
  const [fields, setFields] = useState(EMPTY);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [selectedGif, setSelectedGif] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [searching, setSearching] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function close() {
    setFields(EMPTY);
    setGifQuery('');
    setGifResults([]);
    setSelectedGif('');
    setManualUrl('');
    setFormError('');
    onClose();
  }

  async function handleGifSearch(e) {
    e.preventDefault();
    if (!gifQuery.trim()) return;
    setSearching(true);
    setFormError('');
    try {
      const results = await searchGifs(gifQuery);
      setGifResults(results);
      if (results.length === 0) setFormError('No gifs found for that search.');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const gifUrl = selectedGif || manualUrl.trim();
    if (!fields.message.trim()) return setFormError('Message is required.');
    if (!gifUrl) return setFormError('Please select or paste a gif.');

    setSubmitting(true);
    setFormError('');
    try {
      await onCreate({ message: fields.message, gifUrl, author: fields.author });
      close();
    } catch (err) {
      setFormError(err.message || 'Could not create card.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Add New Card">
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Message *</span>
          <textarea
            rows={3}
            value={fields.message}
            onChange={(e) => update('message', e.target.value)}
            placeholder="Write your kudos…"
            autoFocus
          />
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

        <div className="field">
          <span>Gif *</span>
          {hasGiphyKey ? (
            <>
              <div className="gif-search">
                <input
                  type="text"
                  value={gifQuery}
                  onChange={(e) => setGifQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGifSearch(e);
                  }}
                  placeholder="Search GIPHY…"
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGifSearch}
                  disabled={searching}
                >
                  {searching ? 'Searching…' : 'Search'}
                </button>
              </div>
              {gifResults.length > 0 && (
                <div className="gif-results">
                  {gifResults.map((gif) => (
                    <button
                      type="button"
                      key={gif.id}
                      className={`gif-result ${selectedGif === gif.url ? 'is-selected' : ''}`}
                      onClick={() => setSelectedGif(gif.url)}
                    >
                      <img src={gif.preview} alt={gif.title} />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="Paste a gif URL (set VITE_GIPHY_API_KEY to search)"
            />
          )}
        </div>

        {selectedGif && (
          <div className="gif-selected">
            <img src={selectedGif} alt="Selected gif" />
          </div>
        )}

        {formError && <p className="form-error">{formError}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Card'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
