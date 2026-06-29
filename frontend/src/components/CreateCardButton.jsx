// Triggers the create-card modal. Presentational; BoardPage owns the handler.
export default function CreateCardButton({ onClick }) {
  return (
    <button type="button" className="btn btn-primary btn-create" onClick={onClick}>
      + Add New Card
    </button>
  );
}
