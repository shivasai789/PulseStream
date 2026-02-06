import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listVideos } from "../api/videos.js";
import { getSocket } from "../api/socket.js";
import { formatDuration, timeAgo, formatDate } from "../utils/format.js";
import VideoStatusPill from "../components/VideoStatusPill.jsx";

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
    camera: (
      <svg {...svgProps}>
        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
      </svg>
    ),
    check: (
      <svg {...svgProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    flag: (
      <svg {...svgProps}>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    clock: (
      <svg {...svgProps}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  };
  return icons[type] ?? null;
}

function getMetricsFromVideos(videos) {
  const total = videos.length;
  const safe = videos.filter(
    (v) => v.status === "completed" && v.sensitivity === "safe"
  ).length;
  const flagged = videos.filter(
    (v) => v.status === "completed" && v.sensitivity === "flagged"
  ).length;
  const processing = videos.filter(
    (v) => v.status === "processing" || v.status === "uploading"
  ).length;
  return [
    { label: "Total Videos", value: total.toLocaleString(), icon: "blue", svg: "camera" },
    { label: "Safe Videos", value: safe.toLocaleString(), icon: "green", svg: "check" },
    { label: "Flagged Content", value: flagged.toLocaleString(), icon: "red", svg: "flag" },
    { label: "Processing", value: processing.toLocaleString(), icon: "yellow", svg: "clock" },
  ];
}

function getRecentActivityFromVideos(videos) {
  const sorted = [...videos].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return sorted.slice(0, 12).map((v) => {
    const isProcessing = v.status === "processing" || v.status === "uploading";
    const isSafe = v.status === "completed" && v.sensitivity === "safe";
    const isFlagged = v.status === "completed" && v.sensitivity === "flagged";
    let activityType = "uploaded";
    let activityLabel = "Video uploaded";
    if (isSafe) {
      activityType = "complete";
      activityLabel = "Analysis complete";
    } else if (isFlagged) {
      activityType = "flagged";
      activityLabel = "Content flagged";
    } else if (isProcessing) {
      activityType = "processing";
      activityLabel = "Processing";
    } else if (v.status === "failed") {
      activityType = "failed";
      activityLabel = "Processing failed";
    }
    return {
      ...v,
      activityType,
      activityLabel,
    };
  });
}

export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchVideos() {
      try {
        const list = await listVideos();
        if (!cancelled) setVideos(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load dashboard data.");
          setVideos([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchVideos();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (videos.length === 0) return;
    const s = getSocket();
    if (!s) return;
    const handler = (payload) => {
      setVideos((prev) =>
        prev.map((v) =>
          String(v._id) === String(payload.videoId)
            ? { ...v, status: payload.status, sensitivity: payload.sensitivity, progress: payload.progress }
            : v
        )
      );
    };
    s.on("video:progress", handler);
    return () => s.off("video:progress", handler);
  }, [videos.length]);

  const metrics = getMetricsFromVideos(videos);
  const recentActivity = getRecentActivityFromVideos(videos);

  if (loading) {
    return (
      <>
        <h1 className="dashboard-page-title">Dashboard</h1>
        <p className="dashboard-page-subtitle">
          Monitor your video content in real-time.
        </p>
        <div className="dashboard-loading">Loading dashboard…</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <h1 className="dashboard-page-title">Dashboard</h1>
        <p className="dashboard-page-subtitle">
          Monitor your video content in real-time.
        </p>
        <div className="card">
          <p className="upload-error">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="dashboard-page-title">Dashboard</h1>
      <p className="dashboard-page-subtitle">
        Monitor your video content in real-time.
      </p>

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

      <section className="recent-activity-section">
        <h2 className="card-title card-title-with-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="card-title-icon"
          >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
          Recent Activity
        </h2>

        {recentActivity.length === 0 ? (
          <div className="card recent-activity-empty-card">
            <p className="recent-activity-empty-text">No recent activity. Upload a video to get started.</p>
          </div>
        ) : (
          <div className="activity-cards">
            {recentActivity.map((item) => (
              <Link
                key={item._id}
                to={`/library/${item._id}`}
                className="activity-card"
              >
                <div className="activity-card-thumb">
                  <div className="activity-card-thumb-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="6" width="14" height="12" rx="2" />
                      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                    </svg>
                  </div>
                  <span className="activity-card-duration">{formatDuration(item.duration)}</span>
                </div>
                <div className="activity-card-body">
                  <div className="activity-card-head">
                    <h3 className="activity-card-title">{item.title || "Untitled"}</h3>
                    <VideoStatusPill
                    status={item.status}
                    sensitivity={item.sensitivity}
                    classNamePrefix="activity-card-status"
                    processingWithIcon={false}
                  />
                  </div>
                  <div className="activity-card-type">
                    <span className={`activity-card-type-badge activity-card-type-${item.activityType}`}>
                      {item.activityLabel}
                    </span>
                  </div>
                  <div className="activity-card-meta">
                    <span className="activity-card-time">{timeAgo(item.createdAt)}</span>
                    <span className="activity-card-sep">·</span>
                    <span className="activity-card-date">{formatDate(item.createdAt)}</span>
                    {item.duration != null && (
                      <>
                        <span className="activity-card-sep">·</span>
                        <span className="activity-card-dur">{formatDuration(item.duration)}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="activity-card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
