import { useNavigate } from 'react-router-dom';

const CATEGORY_LABELS = {
  celebration: 'Celebration',
  'thank-you': 'Thank You',
  inspiration: 'Inspiration',
};

// One board tile: image, title, category, optional author, View + Delete.
export default function BoardCard({ board, onDelete }) {
  const navigate = useNavigate();

  return (
    <article className="board-card">
      <div
        className="board-card-image"
        onClick={() => navigate(`/boards/${board.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') navigate(`/boards/${board.id}`);
        }}
      >
        <img src={board.imageUrl} alt={board.title} loading="lazy" />
        <span className="board-card-tag">{CATEGORY_LABELS[board.category] || board.category}</span>
      </div>
      <div className="board-card-body">
        <h3 className="board-card-title">{board.title}</h3>
        {board.author && <p className="board-card-author">by {board.author}</p>}
      </div>
      <div className="board-card-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/boards/${board.id}`)}
        >
          View Board
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onDelete(board.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
