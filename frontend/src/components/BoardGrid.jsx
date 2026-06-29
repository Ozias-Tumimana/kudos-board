import BoardCard from './BoardCard';

// Lays boards out in a responsive grid. Stateless pass-through to BoardCard.
export default function BoardGrid({ boards, onDelete }) {
  if (boards.length === 0) {
    return <p className="empty-state">No boards found. Create one to get started!</p>;
  }
  return (
    <div className="grid board-grid">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} onDelete={onDelete} />
      ))}
    </div>
  );
}
