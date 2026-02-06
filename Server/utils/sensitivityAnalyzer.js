// Classify video as 'safe' or 'flagged' based on simple rules (metadata, duration).
const classify = (video) => {
  if (!video) return 'safe';

  const duration = video.duration != null ? video.duration : 0;
  const size = video.size != null ? video.size : 0;

  // Example rules: flag very long or very large files; adjust as needed
  const maxDurationSeconds = 4 * 60 * 60; // 4 hours
  const maxSizeBytes = 2 * 1024 * 1024 * 1024; // 2GB

  if (duration > maxDurationSeconds || size > maxSizeBytes) {
    return 'flagged';
  }

  return 'safe';
};

module.exports = { classify };
