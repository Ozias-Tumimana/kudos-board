import Card from './Card';

// Lays cards out in a responsive grid. Stateless pass-through to Card.
// Cards arrive pre-sorted by the backend (pinned first, then newest).
export default function CardGrid({ cards, onUpvote, onDelete, onPin, onComments }) {
  if (cards.length === 0) {
    return <p className="empty-state">No cards yet. Add the first one!</p>;
  }
  return (
    <div className="grid card-grid">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          onUpvote={onUpvote}
          onDelete={onDelete}
          onPin={onPin}
          onComments={onComments}
        />
      ))}
    </div>
  );
}
