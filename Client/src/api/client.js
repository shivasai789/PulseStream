const BASE = import.meta.env.VITE_SERVER_URL ?? "";

function getAuthHeader() {
  const token = localStorage.getItem("pulsestream_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleResponse(res, data, defaultMessage = "Request failed") {
  const failed = data.success === false;
  if (failed) {
    const err = new Error(data.message || defaultMessage);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function api(path, options = {}) {
  const url = `${BASE}/${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return handleResponse(res, data, "Request failed");
}

export async function uploadVideo(title, file) {
  const url = `${BASE}/videos/upload`;
  const token = localStorage.getItem("pulsestream_token");
  const headers = { Authorization: token ? `Bearer ${token}` : "" };
  const body = new FormData();
  body.append("title", title);
  body.append("video", file);
  const res = await fetch(url, { method: "POST", headers, body });
  const data = await res.json().catch(() => ({}));
  return handleResponse(res, data, "Upload failed");
}

export default api; 
