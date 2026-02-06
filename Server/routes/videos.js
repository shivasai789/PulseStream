const express = require("express");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { upload } = require("../services/videoUploadService");
const videoController = require("../controllers/videoController");

const router = express.Router();

const handleUploadError = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File size exceeds limit" });
  }
  return res.status(400).json({ success: false, message: err.message || "Upload failed" });
};

router.get(
  "/",
  auth,
  requireRole(["viewer", "editor", "admin"]),
  videoController.list,
);
router.get(
  "/:id/stream",
  auth,
  requireRole(["viewer", "editor", "admin"]),
  videoController.getStream,
);
router.get(
  "/:id",
  auth,
  requireRole(["viewer", "editor", "admin"]),
  videoController.getOne,
);

router.post(
  "/upload",
  auth,
  requireRole(["editor", "admin"]),
  upload.single("video"),
  handleUploadError,
  videoController.upload,
);

router.patch(
  "/:id",
  auth,
  requireRole(["editor", "admin"]),
  videoController.updateMetadata,
);
router.delete(
  "/:id",
  auth,
  requireRole(["editor", "admin"]),
  videoController.remove,
);

module.exports = router;
