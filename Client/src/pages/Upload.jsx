import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideo } from "../api/client.js";
import { getSocket, subscribeVideoProgress } from "../api/socket.js";
import toast from "../utils/toast.js";

const ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-msvideo";
const MAX_SIZE_MB = 500;

function SmallUploadIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function LargeUploadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={64}
      height={64}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="upload-zone-icon-large"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function getTitleFromFile(file) {
  const name = file?.name ?? "";
  const lastDot = name.lastIndexOf(".");
  return lastDot > 0 ? name.slice(0, lastDot) : name || "Untitled video";
}

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [processingVideoId, setProcessingVideoId] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!processingVideoId) return;
    getSocket();
    const unsub = subscribeVideoProgress(processingVideoId, (payload) => {
      setProcessingProgress(payload.progress ?? 0);
      if (payload.status === "completed") {
        toast.success("Video uploaded and processed successfully. View it in Library.");
        setProcessingVideoId(null);
        setProcessingProgress(0);
        clearFile();
        navigate("/library");
      } else if (payload.status === "failed") {
        toast.error(payload.error || "Processing failed.");
        setProcessingVideoId(null);
        setProcessingProgress(0);
      }
    });
    return unsub;
  }, [processingVideoId, navigate]);

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type.startsWith("video/")) {
      setFile(f);
      setError("");
    } else if (f) {
      setError("Please choose a video file (e.g. MP4, WebM).");
    }
  }

  function handleChange(e) {
    const f = e.target?.files?.[0];
    if (f) {
      setFile(f);
      setError("");
    }
    e.target.value = "";
  }

  function clearFile() {
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function openBrowse() {
    inputRef.current?.click();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please select a video file.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB} MB.`);
      return;
    }
    setUploading(true);
    try {
      const title = getTitleFromFile(file);
      const data = await uploadVideo(title, file);
      const videoId = data?.videoId;
      if (videoId) {
        setProcessingVideoId(videoId);
        setProcessingProgress(0);
      }
      clearFile();
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Upload failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <h1 className="dashboard-page-title">Upload Videos</h1>
      <p className="dashboard-page-subtitle">
        Upload videos for sensitivity analysis and processing
      </p>

      <div className="card upload-card">
        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="upload-zone-header">
              <SmallUploadIcon className="upload-zone-header-icon" />
              <span className="upload-zone-header-text">Select Videos</span>
          </div>
          <div
            className={`upload-zone ${dragActive ? "upload-zone-active" : ""} ${file ? "upload-zone-has-file" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              onChange={handleChange}
              className="upload-input"
            />
            <div
              className="upload-zone-body"
              onClick={(e) => {
                if (e.target.closest?.(".upload-browse-btn")) return;
                openBrowse();
              }}
              onKeyDown={(e) => {
                if (e.target.closest?.(".upload-browse-btn")) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openBrowse();
                }
              }}
              tabIndex={0}
            >
              <LargeUploadIcon />
              <p className="upload-zone-title">Drag & drop videos here</p>
              <p className="upload-zone-hint">
                or click to browse from your computer
              </p>
              <button
                type="button"
                className="upload-browse-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openBrowse();
                }}
              >
                Browse Files
              </button>
            </div>
            <p className="upload-zone-max">Maximum file size: {MAX_SIZE_MB}MB</p>
            {file && (
              <div className="upload-zone-selected">
                <span className="upload-zone-filename">{file.name}</span>
                <span className="upload-zone-filesize">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <button
                  type="button"
                  className="upload-zone-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="upload-error">
              {error}
            </p>
          )}

          {processingVideoId && (
            <div className="upload-progress-wrap">
              <p className="upload-progress-label">Processing & sensitivity analysis</p>
              <div className="upload-progress-bar">
                <div
                  className="upload-progress-fill"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="upload-progress-percent">{processingProgress}%</p>
            </div>
          )}

          <button
            type="submit"
            className="upload-submit upload-submit-full"
            disabled={uploading || !file}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      </div>
    </>
  );
}
