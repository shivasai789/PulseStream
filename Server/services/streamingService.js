const fs = require("fs");
const path = require("path");

function streamVideo(req, res, video) {
  const filePath = video.filePath;
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ message: "File not found" });
    return;
  }

  const stat = fs.statSync(filePath);
  const size = stat.size;
  const range = req.headers.range;
  const contentType = video.mimeType || getMimeFromExt(path.extname(filePath));

  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", contentType);

  if (range) {
    const match = range.match(/^bytes=(\d+)-(\d*)$/);
    if (!match) {
      res.status(400).json({ message: "Invalid Range header" });
      return;
    }
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : size - 1;
    const chunkSize = end - start + 1;

    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    res.setHeader("Content-Length", chunkSize);

    const stream = fs.createReadStream(filePath, { start, end });
    stream.on("error", (err) => {
      if (!res.headersSent) res.status(500).json({ message: "Stream error" });
    });
    stream.pipe(res);
  } else {
    res.status(200);
    res.setHeader("Content-Length", size);
    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => {
      if (!res.headersSent) res.status(500).json({ message: "Stream error" });
    });
    stream.pipe(res);
  }
}

function getMimeFromExt(ext) {
  const map = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
  };
  return map[ext?.toLowerCase()] || "video/mp4";
}

module.exports = { streamVideo };
