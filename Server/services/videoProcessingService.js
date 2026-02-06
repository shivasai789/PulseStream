const path = require("path");
const fs = require("fs");
const os = require("os");
const ffmpeg = require("fluent-ffmpeg");
const Video = require("../models/Video");
const { classify } = require("../utils/sensitivityAnalyzer");

const emitProgress = (io, room, payload) => {
  if (io) io.to(room).emit("video:progress", payload);
};

/**
 * Single async pipeline: status → FFmpeg duration → optional faststart → sensitivity → completed/failed.
 * Emits video:progress to room user:${ownerId} at each step.
 */
const processVideo = async (io, videoId) => {
  let video;
  let room;

  try {
    video = await Video.findById(videoId).lean();
    if (!video) {
      console.error("Video not found:", videoId);
      return;
    }

    room = `user:${video.ownerId}`;
    await Video.findByIdAndUpdate(videoId, {
      status: "processing",
      progress: 0,
    });
    emitProgress(io, room, {
      videoId,
      status: "processing",
      progress: 0,
      sensitivity: null,
    });

    const filePath = video.filePath;
    if (!fs.existsSync(filePath)) {
      throw new Error("Video file not found");
    }

    const duration = await getDuration(filePath);
    await Video.findByIdAndUpdate(videoId, { duration, progress: 25 });
    emitProgress(io, room, {
      videoId,
      status: "processing",
      progress: 25,
      sensitivity: null,
      duration,
    });

    await ensureStreamable(filePath);

    const updated = await Video.findById(videoId).lean();
    const sensitivity = classify({ ...updated, duration });
    await Video.findByIdAndUpdate(videoId, { sensitivity, progress: 80 });
    emitProgress(io, room, {
      videoId,
      status: "processing",
      progress: 80,
      sensitivity,
    });

    await Video.findByIdAndUpdate(videoId, {
      status: "completed",
      progress: 100,
    });
    emitProgress(io, room, {
      videoId,
      status: "completed",
      progress: 100,
      sensitivity,
    });
  } catch (err) {
    console.error("Video processing error:", err);
    const errorMessage = err.message || "Processing failed";
    await Video.findByIdAndUpdate(videoId, {
      status: "failed",
      error: errorMessage,
    });
    if (room && io) {
      io.to(room).emit("video:progress", {
        videoId,
        status: "failed",
        progress: null,
        sensitivity: null,
        error: errorMessage,
      });
    }
  }
};

function getDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata?.format?.duration;
      resolve(duration != null ? Math.round(duration) : null);
    });
  });
}

function ensureStreamable(filePath) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== ".mp4" && ext !== ".mov") {
      return resolve();
    }
    const absolutePath = path.resolve(filePath);
    const pathForFfmpeg = (p) => p.replace(/\\/g, "/");
    const tmpDir = os.tmpdir();
    const tmpBasename = path.basename(absolutePath, ext) + ".streamable" + ext;
    const tmpPath = path.join(tmpDir, tmpBasename);
    const command = ffmpeg(pathForFfmpeg(absolutePath))
      .outputOptions(["-c", "copy", "-movflags", "+faststart"])
      .output(pathForFfmpeg(tmpPath))
      .on("end", () => {
        try {
          fs.renameSync(tmpPath, absolutePath);
          resolve();
        } catch (e) {
          try {
            fs.unlinkSync(tmpPath);
          } catch (_) {}
          reject(e);
        }
      })
      .on("error", (err) => {
        fs.unlink(tmpPath, () => {});
        reject(err);
      });
    command.run();
  });
}

module.exports = { processVideo };
