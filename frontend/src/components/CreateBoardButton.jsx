// Triggers the create-board modal. Presentational; HomePage owns the handler.
export default function CreateBoardButton({ onClick }) {
  return (
    <button type="button" className="btn btn-primary btn-create" onClick={onClick}>
      + Create New Board
    </button>
  );
}
