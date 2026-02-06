/**
 * Reusable confirmation modal for delete actions (e.g. Delete Video, Delete User).
 * Uses admin-modal-* classes so it matches existing admin/Library styling.
 */
export default function ConfirmDeleteModal({
  title = "Delete",
  itemName = "",
  warningText = "This cannot be undone.",
  onClose,
  onConfirm,
  submitting,
  confirmLabel = "Delete",
  submittingLabel = "Deleting…",
}) {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="admin-modal-title">{title}</h2>
        <p className="admin-delete-text">
          Are you sure you want to delete <strong>{itemName}</strong>? {warningText}
        </p>
        <div className="admin-modal-actions">
          <button type="button" className="admin-modal-btn admin-modal-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-modal-btn admin-modal-btn-danger"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? submittingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
