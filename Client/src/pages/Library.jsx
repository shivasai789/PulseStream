import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth.js";
import { listVideos, deleteVideo } from "../api/videos.js";
import { getSocket } from "../api/socket.js";
import toast from "react-hot-toast";
import VideoCard from "../components/VideoCard.jsx";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal.jsx";

export default function Library() {
  const { user } = useAuth();
  const canDelete = user?.role === "editor" || user?.role === "admin";
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveProgress, setLiveProgress] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteVideo(id);
      setVideos((prev) => prev.filter((v) => String(v._id) !== String(id)));
      setDeleteTarget(null);
      toast.success("Video deleted");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to delete video");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchVideos() {
      try {
        const list = await listVideos();
        if (!cancelled) setVideos(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load videos.");
          setVideos([]);
        }
      } finally {
        if (!cancelled) setLoading(false);s
      }
    }
    fetchVideos();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (videos.length === 0) return;
    getSocket();
    const handler = (payload) => {
      setLiveProgress((prev) => {
        if (prev?.videoId === payload.videoId) {
          return { ...prev, ...payload };
        }
        return { videoId: payload.videoId, ...payload };
      });
      if (payload.status === "completed" || payload.status === "failed") {
        setVideos((prev) =>
          prev.map((v) =>
            String(v._id) === String(payload.videoId)
              ? { ...v, status: payload.status, sensitivity: payload.sensitivity, progress: payload.progress }
              : v
          )
        );
        setLiveProgress(null);
      }
    };
    const s = getSocket();
    if (!s) return;
    s.on("video:progress", handler);
    return () => s.off("video:progress", handler);
  }, [videos.length]);

  return (
    <>
      <h1 className="dashboard-page-title">Library</h1>
      <p className="dashboard-page-subtitle">
        Your uploaded videos. Status updates in real time.
      </p>

      {error && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <p className="upload-error">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="library-loading">Loading videos…</div>
      ) : videos.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--ps-text-muted)", margin: 0 }}>
            No videos yet. Upload a video from the Upload page.
          </p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              liveProgress={
                liveProgress?.videoId === video._id ? liveProgress : null
              }
              canDelete={canDelete}
              onRequestDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Video"
          itemName={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
          submitting={deleting}
        />
      )}
    </>
  );
}
