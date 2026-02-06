import api from "./client.js";

export async function login(email, password) {
  return api("auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register({ name, email, password, role }) {
  return api("auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, ...(role && { role }) }),
  });
}

/** Get current user from token. Requires auth. */
export async function getCurrentUser() {
  const data = await api("auth/me", { method: "GET" });
  return data.user;
}
