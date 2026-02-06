import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import {
  getAdminStats,
  listAdminUsers,
  addAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "../api/admin.js";
import toast from "react-hot-toast";
import { formatDate } from "../utils/format.js";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal.jsx";
import UserModal from "../components/UserModal.jsx";

function MetricIcon({ type }) {
  const svgProps = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const icons = {
    users: (
      <svg {...svgProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    active: (
      <svg {...svgProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    shield: (
      <svg {...svgProps}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      </svg>
    ),
    regular: (
      <svg {...svgProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  };
  return icons[type] ?? null;
}

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { type: 'add' } | { type: 'edit', user } | null
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [statsData, usersList] = await Promise.all([
        getAdminStats(),
        listAdminUsers(),
      ]);
      setStats(statsData);
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (err) {
      setError(err?.message || "Failed to load admin data.");
      setStats(null);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddUser(form) {
    setSubmitting(true);
    try {
      await addAdminUser(form);
      toast.success("User created successfully");
      setModal(null);
      load();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateUser(id, form) {
    setSubmitting(true);
    try {
      await updateAdminUser(id, form);
      toast.success("User updated successfully");
      setModal(null);
      load();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUser(id) {
    setSubmitting(true);
    try {
      await deleteAdminUser(id);
      toast.success("User deleted successfully");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to delete user");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <h1 className="dashboard-page-title">Admin Panel</h1>
        <p className="dashboard-page-subtitle">Manage users and roles.</p>
        <div className="dashboard-loading">Loading…</div>
      </>
    );
  }

  const metrics = stats
    ? [
        {
          label: "Total Users",
          value: String(stats.totalUsers ?? 0),
          icon: "blue",
          svg: "users",
        },
        {
          label: "Active Users",
          value: String(stats.activeUsers ?? 0),
          icon: "green",
          svg: "active",
        },
        {
          label: "Admins",
          value: String(stats.admins ?? 0),
          icon: "purple",
          svg: "shield",
        },
        {
          label: "Regular Users",
          value: String(stats.regularUsers ?? 0),
          icon: "orange",
          svg: "regular",
        },
      ]
    : [];

  return (
    <>
      <div className="admin-header">
        <div>
          <h1 className="dashboard-page-title">Admin Panel</h1>
          <p className="dashboard-page-subtitle">Manage users and roles.</p>
        </div>
        <button
          type="button"
          className="admin-add-btn"
          onClick={() => setModal({ type: "add" })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Add User
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <p className="upload-error">
            {error}
          </p>
        </div>
      )}

      <div className="metrics-grid">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <div className="metric-card-content">
              <div className="metric-card-value">{m.value}</div>
              <div className="metric-card-label">{m.label}</div>
            </div>
            <div className={`metric-card-icon ${m.icon}`}>
              <MetricIcon type={m.svg} />
            </div>
          </div>
        ))}
      </div>

      <div className="card admin-table-card">
        <h2 className="card-title">Users</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Videos</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty">
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-table-user">
                        <span className="admin-table-name">{u.name}</span>
                        <span className="admin-table-email">{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`admin-role-pill ${
                          u.role === "admin" ? "admin-role-admin" : "admin-role-user"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td>
                      <span className="admin-status-pill">Active</span>
                    </td>
                    <td>{u.videoCount ?? 0}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="admin-action-btn"
                          onClick={() => setModal({ type: "edit", user: u })}
                          title="Edit user"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="admin-action-btn admin-action-btn-danger"
                          onClick={() => setDeleteId(u._id)}
                          title="Delete user"
                          disabled={String(u._id) === String(user?._id)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.type === "add" && (
        <UserModal
          mode="add"
          onClose={() => setModal(null)}
          onSubmit={handleAddUser}
          submitting={submitting}
        />
      )}
      {modal?.type === "edit" && modal?.user && (
        <UserModal
          mode="edit"
          user={modal.user}
          onClose={() => setModal(null)}
          onSubmit={handleUpdateUser}
          submitting={submitting}
        />
      )}
      {deleteId && (
        <ConfirmDeleteModal
          title="Delete User"
          itemName={users.find((u) => u._id === deleteId)?.name ?? "User"}
          onClose={() => setDeleteId(null)}
          onConfirm={() => handleDeleteUser(deleteId)}
          submitting={submitting}
        />
      )}
    </>
  );
}



