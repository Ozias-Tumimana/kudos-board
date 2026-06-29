import { useState } from 'react';

// Search boards by title. Owns its local input value; reports the committed
// query up to HomePage on submit (Enter or button), and clears it on Clear.
export default function SearchBar({ query, onSearch, onClear }) {
  const [input, setInput] = useState(query ?? '');

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(input);
  }

  function handleClear() {
    setInput('');
    onClear();
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <input
        type="text"
        className="search-input"
        placeholder="Search boards by title…"
        value={input}
        onChange={(e) => {
          const next = e.target.value;
          setInput(next);
          // When the field is fully cleared, show all boards immediately.
          if (next === '') onClear();
        }}
        aria-label="Search boards by title"
      />
      <button type="submit" className="btn btn-primary">
        Search
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={handleClear}
        disabled={input === ''}
      >
        Clear
      </button>
    </form>
  );
}
