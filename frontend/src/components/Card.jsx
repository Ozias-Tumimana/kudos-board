// One kudos card: message, gif, upvote count + button, delete button.
export default function Card({ card, onUpvote, onDelete }) {
  return (
    <article className="card">
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
          className="btn btn-danger"
          onClick={() => onDelete(card.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
