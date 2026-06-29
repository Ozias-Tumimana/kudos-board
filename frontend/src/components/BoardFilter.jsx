// Category filter for the board grid. Stateless: the active value and change
// handler are owned by HomePage. Stretch: the "Mine" filter appears only when a
// user is logged in (showMine), per the user-accounts feature.
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'recent', label: 'Recent' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'thank-you', label: 'Thank You' },
  { value: 'inspiration', label: 'Inspiration' },
];

export default function BoardFilter({ active, onChange, showMine = false }) {
  const filters = showMine ? [...FILTERS, { value: 'mine', label: 'My Boards' }] : FILTERS;

  return (
    <div className="board-filter" role="group" aria-label="Filter boards by category">
      {filters.map((f) => (
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
