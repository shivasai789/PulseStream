// RBAC: viewer = see all read-only; editor = upload + modify/delete; admin = all + user management.

// Returns the MongoDB filter for listing/finding videos. All roles see the full library.
const getVideoFilter = (req) => {
  if (!req.user) return null;
  return {};
};

// Whether the current user can modify (edit/delete) this video. Only editor and admin.
const canModifyVideo = (req, video) => {
  if (!req.user) return false;
  if (req.user.role === 'admin' || req.user.role === 'editor') return true;
  return false;
};

module.exports = { getVideoFilter, canModifyVideo };
