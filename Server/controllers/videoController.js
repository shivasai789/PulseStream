const fs = require("fs");
const Video = require("../models/Video");
const { processVideo } = require("../services/videoProcessingService");
const { streamVideo } = require("../services/streamingService");
const { getVideoFilter, canModifyVideo } = require("../utils/accessHelpers");

const upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video file uploaded" });
    }

    const title = req.body.title?.trim();
    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const video = await Video.create({
      title,
      ownerId: req.user.id,
      filePath: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: "uploading",
    });

    video.status = "processing";
    await video.save();

    const io = req.app.get("io");
    processVideo(io, video._id);

    res.status(201).json({
      success: true,
      videoId: video._id,
      message: "Upload started. Processing in background.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const list = async (req, res) => {
  try {
    const filter = getVideoFilter(req);
    if (!filter) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { status, sensitivity } = req.query;
    const query = { ...filter };
    if (status) query.status = status;
    if (sensitivity) query.sensitivity = sensitivity;
    const videos = await Video.find(query)
      .select("-filePath -__v")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, videos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getOne = async (req, res) => {
  try {
    const filter = getVideoFilter(req);
    if (!filter) return res.status(401).json({ success: false, message: "Unauthorized" });
    const video = await Video.findOne({ _id: req.params.id, ...filter })
      .select("-filePath -__v")
      .lean();
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });
    res.json({ success: true, ...video });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getStream = async (req, res) => {
  try {
    const filter = getVideoFilter(req);
    if (!filter) return res.status(401).json({ success: false, message: "Unauthorized" });
    const video = await Video.findOne({ _id: req.params.id, ...filter }).lean();
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });
    if (video.status !== "completed") {
      return res
        .status(403)
        .json({ success: false, message: "Video is not ready for streaming" });
    }
    streamVideo(req, res, video);
  } catch (err) {
    console.error(err);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateMetadata = async (req, res) => {
  try {
    const filter = getVideoFilter(req);
    if (!filter) return res.status(401).json({ success: false, message: "Unauthorized" });
    const video = await Video.findOne({ _id: req.params.id, ...filter });
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });
    if (!canModifyVideo(req, video)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { title } = req.body;
    if (title !== undefined) video.title = title.trim() || video.title;
    await video.save();
    const out = video.toObject();
    delete out.filePath;
    delete out.__v;
    res.json({ success: true, ...out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const remove = async (req, res) => {
  try {
    const filter = getVideoFilter(req);
    if (!filter) return res.status(401).json({ success: false, message: "Unauthorized" });
    const video = await Video.findOne({ _id: req.params.id, ...filter });
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });
    if (!canModifyVideo(req, video)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const filePath = video.filePath;
    await Video.findByIdAndDelete(video._id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(200).json({ success: true, message: "Video deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { upload, list, getOne, getStream, updateMetadata, remove };
