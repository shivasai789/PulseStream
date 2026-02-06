import { Link } from "react-router-dom";
import { formatDuration, timeAgo } from "../utils/format.js";
import VideoStatusPill from "./VideoStatusPill.jsx";

export default function VideoCard({ video, liveProgress, canDelete, onRequestDelete }) {
  const v = liveProgress?.videoId === video._id ? { ...video, ...liveProgress } : video;

  function handleDeleteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!canDelete || !onRequestDelete) return;
    onRequestDelete({ id: video._id, title: v.title || "Untitled" });
  }

  return (
    <Link to={`/library/${video._id}`} className="video-card-link">
      <article className="video-card">
        <div className="video-card-thumb">
          <div className="video-card-thumb-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="6" width="14" height="12" rx="2" />
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
            </svg>
          </div>
          <span className="video-card-duration">{formatDuration(v.duration)}</span>
        </div>
        <div className="video-card-body">
          <h3 className="video-card-title">{v.title || "Untitled"}</h3>
          <VideoStatusPill status={v.status} sensitivity={v.sensitivity} classNamePrefix="video-card-status" />
          <div className="video-card-meta">
            <span className="video-card-time">{timeAgo(v.createdAt)}</span>
            {canDelete && (
              <button
                type="button"
                className="video-card-delete"
                onClick={handleDeleteClick}
                title="Delete video"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
