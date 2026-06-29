import { useCallback, useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import BoardFilter from '../components/BoardFilter';
import CreateBoardButton from '../components/CreateBoardButton';
import BoardGrid from '../components/BoardGrid';
import CreateBoardModal from '../components/CreateBoardModal';
import * as api from '../api/client';

// Dashboard route ("/"): list, filter, search, create, and delete boards.
// Owns the board list plus the filter/search/modal UI state (planning.md §4).
export default function HomePage() {
  const [boards, setBoards] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Translate the active filter + search into GET /boards query params.
  const fetchBoards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filter === 'recent') params.recent = true;
      else if (filter !== 'all') params.category = filter;
      if (searchQuery) params.search = searchQuery;
      const data = await api.getBoards(params);
      setBoards(data);
    } catch {
      setError('Could not load boards. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    // Fetch on mount and whenever the filter/search query changes. The effect
    // intentionally drives loading/error state from this async call.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBoards();
  }, [fetchBoards]);

  async function handleCreate(payload) {
    const created = await api.createBoard(payload);
    // Optimistically reflect the new board, then re-sync with current filter.
    setBoards((prev) => [created, ...prev]);
    fetchBoards();
  }

  async function handleDelete(id) {
    await api.deleteBoard(id);
    setBoards((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <main className="container page">
      <div className="toolbar">
        <SearchBar
          query={searchQuery}
          onSearch={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
        <CreateBoardButton onClick={() => setIsCreateOpen(true)} />
      </div>

      <BoardFilter active={filter} onChange={setFilter} />

      {loading && <p className="status">Loading boards…</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && <BoardGrid boards={boards} onDelete={handleDelete} />}

      <CreateBoardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
    </main>
  );
}
