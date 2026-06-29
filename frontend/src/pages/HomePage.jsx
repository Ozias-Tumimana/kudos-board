import { useCallback, useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import BoardFilter from '../components/BoardFilter';
import CreateBoardButton from '../components/CreateBoardButton';
import BoardGrid from '../components/BoardGrid';
import CreateBoardModal from '../components/CreateBoardModal';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

// Dashboard route ("/"): list, filter, search, create, and delete boards.
// Owns the board list plus the filter/search/modal UI state (planning.md §4).
export default function HomePage() {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If the user logs out while on the "Mine" filter, fall back to "all" without
  // an extra effect (deriving it avoids a cascading re-render). The "Mine" button
  // is also hidden when logged out, so nothing stays visually selected.
  const effectiveFilter = !user && filter === 'mine' ? 'all' : filter;

  // Translate the active filter + search into GET /boards query params.
  const fetchBoards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (effectiveFilter === 'recent') params.recent = true;
      else if (effectiveFilter === 'mine') params.mine = true;
      else if (effectiveFilter !== 'all') params.category = effectiveFilter;
      if (searchQuery) params.search = searchQuery;
      const data = await api.getBoards(params);
      setBoards(data);
    } catch {
      setError('Could not load boards. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [effectiveFilter, searchQuery]);

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

      <BoardFilter active={effectiveFilter} onChange={setFilter} showMine={Boolean(user)} />

      {loading && <p className="status">Loading boards…</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && (
        <BoardGrid boards={boards} onDelete={handleDelete} currentUserId={user?.id} />
      )}

      <CreateBoardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
    </main>
  );
}
