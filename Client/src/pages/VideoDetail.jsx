import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { getVideo, getVideoStreamUrl } from "../api/videos.js";
import { formatDuration, formatDate, formatTime, formatFileSize, formatMime } from "../utils/format.js";
import VideoStatusPill from "../components/VideoStatusPill.jsx";

export default function VideoDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;
      try {
        const v = await getVideo(id);
        if (cancelled) return;
        setVideo(v);
        if (v?.status === "completed") {
          const url = getVideoStreamUrl(id);
          if (!cancelled) setStreamUrl(url);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load video.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  function handleDownload() {
    if (!streamUrl || !video?.title) return;
    const a = document.createElement("a");
    a.href = streamUrl;
    a.download = `${(video.title || "video").replace(/[^a-z0-9.-]/gi, "_")}.mp4`;
    a.click();
  }

  if (loading) {
    return (
      <div className="video-detail-page">
        <Link to="/library" className="video-detail-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Library
        </Link>
        <p className="video-detail-loading">Loading…</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="video-detail-page">
        <Link to="/library" className="video-detail-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Library
        </Link>
        <div className="card">
          <p className="upload-error">{error || "Video not found."}</p>
        </div>
      </div>
    );
  }

  const isOwner = user?._id && String(video.ownerId) === String(user._id);

  return (
    <div className="video-detail-page">
      <Link to="/library" className="video-detail-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Library
      </Link>

      <div className="video-detail-layout">
        <div className="video-detail-main">
          <div className="video-detail-player-wrap">
            {streamUrl ? (
              <video
                className="video-detail-player"
                src={streamUrl}
                controls
                poster=""
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="video-detail-player-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <p>
                  {video.status === "completed"
                    ? "Stream unavailable"
                    : "Video is still processing. Playback will be available when complete."}
                </p>
              </div>
            )}
          </div>
          <div className="video-detail-head">
            <h1 className="video-detail-title">{video.title || "Untitled"}</h1>
            <VideoStatusPill
            status={video.status}
            sensitivity={video.sensitivity}
            classNamePrefix="video-detail-status"
            iconSize={16}
          />
          </div>
          <div className="video-detail-meta">
            <span className="video-detail-date">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(video.createdAt)}
            </span>
          </div>
          <div className="video-detail-actions">
            <button
              type="button"
              className="video-detail-btn video-detail-btn-download"
              onClick={handleDownload}
              disabled={!streamUrl}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          </div>
        </div>

        <aside className="video-detail-sidebar">
          <div className="card video-detail-card">
            <h2 className="video-detail-card-title">Video Details</h2>
            <ul className="video-detail-list">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Uploaded by: {isOwner ? "You" : "—"}</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>Format: {formatMime(video.mimeType)}</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="2" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                </svg>
                <span>Resolution: {video.resolution ?? "—"}</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>File Size: {formatFileSize(video.size)}</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Duration: {formatDuration(video.duration)}</span>
              </li>
            </ul>
          </div>
          <div className="card video-detail-card">
            <h2 className="video-detail-card-title">Processing Info</h2>
            <ul className="video-detail-list">
              <li>
                <span>Upload Time: {formatTime(video.createdAt)}</span>
              </li>
              <li>
                <span>Status: </span>
                <VideoStatusPill
                  status={video.status}
                  sensitivity={video.sensitivity}
                  classNamePrefix="video-detail-status"
                  iconSize={16}
                />
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
