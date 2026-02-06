import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SERVER_URL;

let socket = null;

function getToken() {
  return localStorage.getItem("pulsestream_token");
}

export function getSocket() {
  const token = getToken();
  if (!token) return null;
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeVideoProgress(videoId, callback) {
  const s = getSocket();
  if (!s || !videoId) return () => {};

  const handler = (payload) => {
    if (payload?.videoId && String(payload.videoId) === String(videoId)) {
      callback(payload);
    }
  };

  s.on("video:progress", handler);
  return () => {
    s.off("video:progress", handler);
  };
}
