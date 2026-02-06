import api from "./client.js";

export async function getAdminStats() {
  const data = await api("admin/stats");
  return data;
}

export async function listAdminUsers() {
  const data = await api("admin/users");
  return data.users ?? [];
}

export async function addAdminUser({ name, email, password, role }) {
  const data = await api("admin/users", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role: role || "editor" }),
  });
  return data.user;
}

export async function updateAdminUser(id, { name, role }) {
  const data = await api(`admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name, role }),
  });
  return data.user;
}

export async function deleteAdminUser(id) {
  await api(`admin/users/${id}`, { method: "DELETE" });
}
