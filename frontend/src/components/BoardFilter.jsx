// Category filter for the board grid. Stateless: the active value and change
// handler are owned by HomePage.
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'recent', label: 'Recent' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'thank-you', label: 'Thank You' },
  { value: 'inspiration', label: 'Inspiration' },
];

export default function BoardFilter({ active, onChange }) {
  return (
    <div className="board-filter" role="group" aria-label="Filter boards by category">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          type="button"
          className={`filter-btn ${active === f.value ? 'is-active' : ''}`}
          aria-pressed={active === f.value}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
