import { useState } from "react";

export default function UserModal({ mode = "add", user, onClose, onSubmit, submitting }) {
  const isEdit = mode === "edit";
  const [name, setName] = useState(isEdit ? (user?.name ?? "") : "");
  const [email, setEmail] = useState(isEdit ? (user?.email ?? "") : "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(isEdit ? (user?.role ?? "editor") : "editor");

  function handleSubmit(e) {
    e.preventDefault();
    if (isEdit) {
      if (!name.trim()) return;
      onSubmit(user._id, { name: name.trim(), role });
    } else {
      if (!name.trim() || !email.trim() || !password) return;
      onSubmit({ name: name.trim(), email: email.trim(), password, role });
    }
  }

  const title = isEdit ? "Edit User" : "Add User";
  const submitLabel = submitting ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save" : "Create User");

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="admin-modal-title">{title}</h2>
        <form onSubmit={handleSubmit} className="admin-modal-form">
          <label className="admin-form-label">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="admin-form-input"
              required
              autoFocus
            />
          </label>
          {isEdit ? (
            <p className="admin-form-hint">Email: {user?.email}</p>
          ) : (
            <label className="admin-form-label">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-form-input"
                required
              />
            </label>
          )}
          {!isEdit && (
            <label className="admin-form-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-form-input"
                required
                minLength={6}
              />
            </label>
          )}
          <label className="admin-form-label">
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="admin-form-input"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="admin-modal-actions">
            <button type="button" className="admin-modal-btn admin-modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-modal-btn admin-modal-btn-primary" disabled={submitting}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
