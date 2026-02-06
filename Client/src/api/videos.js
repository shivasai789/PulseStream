import api from "./client.js";

const BASE = import.meta.env.VITE_SERVER_URL;

export async function listVideos() {
  const data = await api("videos");
  return data.videos ?? [];
}

export async function getVideo(id) {
  return api(`videos/${id}`);
}

export async function deleteVideo(id) {
  await api(`videos/${id}`, { method: "DELETE" });
}

export function getVideoStreamUrl(id) {
  const token = localStorage.getItem("pulsestream_token");
  if (!token) throw new Error("Not authenticated");
  const base = BASE.replace(/\/$/, "");
  return `${base}/videos/${id}/stream?token=${encodeURIComponent(token)}`;
}
