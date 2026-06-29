// One kudos card: message, gif, upvote count + button, delete button.
// Stretch: Pin button (pinned cards float to the top, with a visual indicator)
// and a Comments button that opens the CommentModal.
export default function Card({ card, onUpvote, onDelete, onPin, onComments }) {
  return (
    <article className={`card ${card.pinned ? 'is-pinned' : ''}`}>
      {card.pinned && (
        <span className="card-pin-badge" aria-label="Pinned card">📌 Pinned</span>
      )}
      <div className="card-gif">
        <img src={card.gifUrl} alt="" loading="lazy" />
      </div>
      <div className="card-body">
        <p className="card-message">{card.message}</p>
        {card.author && <p className="card-author">— {card.author}</p>}
      </div>
      <div className="card-actions">
        <button
          type="button"
          className="btn btn-upvote"
          onClick={() => onUpvote(card.id)}
          aria-label="Upvote card"
        >
          ▲ {card.upvotes}
        </button>
        <button
          type="button"
          className={`btn btn-ghost ${card.pinned ? 'is-active' : ''}`}
          onClick={() => onPin(card.id)}
          aria-pressed={card.pinned}
        >
          {card.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onComments(card)}
        >
          💬 Comments
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onDelete(card.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
