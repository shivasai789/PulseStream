// RBAC & user isolation helpers.

// Returns the MongoDB filter for listing/finding videos for the current user.
const getVideoFilter = (req) => {
  if (!req.user) return null;
  if (req.user.role === 'admin') return {};
  return { ownerId: req.user.id };
};

// Whether the current user can modify (edit/delete) this video.
const canModifyVideo = (req, video) => {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  return String(video.ownerId) === String(req.user.id);
};

module.exports = { getVideoFilter, canModifyVideo };
