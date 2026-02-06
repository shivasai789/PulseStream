export default function VideoStatusPill({
  status,
  sensitivity,
  classNamePrefix = "video-card-status",
  iconSize = 14,
  processingWithIcon = true,
}) {
  const isSafe = status === "completed" && sensitivity === "safe";
  const isFlagged = status === "completed" && sensitivity === "flagged";
  const isProcessing = status === "processing" || status === "uploading";
  const isFailed = status === "failed";

  const svgProps = {
    width: iconSize,
    height: iconSize,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
  };

  if (isSafe) {
    return (
      <span className={`${classNamePrefix} ${classNamePrefix}-safe`}>
        <svg {...svgProps}>
          <path d="m9 12 2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        Safe
      </span>
    );
  }
  if (isFlagged) {
    return (
      <span className={`${classNamePrefix} ${classNamePrefix}-flagged`}>
        <svg {...svgProps}>
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        Flagged
      </span>
    );
  }
  if (isProcessing) {
    return (
      <span className={`${classNamePrefix} ${classNamePrefix}-processing`}>
        {processingWithIcon && (
          <svg {...svgProps}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        )}
        Processing
      </span>
    );
  }
  if (isFailed) {
    return (
      <span
        className={`${classNamePrefix} ${classNamePrefix}-failed`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          color: "#b91c1c",
          background: "#fee2e2",
          padding: "0.25rem 0.65rem",
          borderRadius: "9999px",
          fontSize: "0.8125rem",
          fontWeight: 600,
        }}
      >
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
        Failed
      </span>
    );
  }
  return (
    <span className={`${classNamePrefix} ${classNamePrefix}-default`}>
      {status || "—"}
    </span>
  );
}
