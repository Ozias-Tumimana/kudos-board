import Card from './Card';

// Lays cards out in a responsive grid. Stateless pass-through to Card.
export default function CardGrid({ cards, onUpvote, onDelete }) {
  if (cards.length === 0) {
    return <p className="empty-state">No cards yet. Add the first one!</p>;
  }
  return (
    <div className="grid card-grid">
      {cards.map((card) => (
        <Card key={card.id} card={card} onUpvote={onUpvote} onDelete={onDelete} />
      ))}
    </div>
  );
}
