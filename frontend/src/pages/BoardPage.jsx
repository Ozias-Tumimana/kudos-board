import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CreateCardButton from '../components/CreateCardButton';
import CardGrid from '../components/CardGrid';
import CreateCardModal from '../components/CreateCardModal';
import * as api from '../api/client';

// Board detail route ("/boards/:boardId"): one board and its cards. Owns the
// board, its card list, and the create-card modal state (planning.md §4).
export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [cards, setCards] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [boardData, cardData] = await Promise.all([
        api.getBoard(boardId),
        api.getCards(boardId),
      ]);
      setBoard(boardData);
      setCards(cardData);
    } catch {
      setError('Could not load this board.');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    // Fetch the board + its cards on mount / when the route param changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  async function handleCreate(payload) {
    const created = await api.createCard({ ...payload, boardId: Number(boardId) });
    setCards((prev) => [...prev, created]);
  }

  async function handleUpvote(id) {
    const updated = await api.upvoteCard(id);
    setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function handleDelete(id) {
    await api.deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <main className="container page">
      <Link to="/" className="back-link">
        ← Back to all boards
      </Link>

      {loading && <p className="status">Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {board && (
        <>
          <div className="board-header">
            <div>
              <h1>{board.title}</h1>
              {board.author && <p className="board-header-author">by {board.author}</p>}
            </div>
            <CreateCardButton onClick={() => setIsCreateOpen(true)} />
          </div>

          <CardGrid cards={cards} onUpvote={handleUpvote} onDelete={handleDelete} />

          <CreateCardModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onCreate={handleCreate}
          />
        </>
      )}
    </main>
  );
}
