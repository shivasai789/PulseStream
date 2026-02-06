require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const routes = require("./routes");

const app = express();
const server = http.createServer(app);
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
const io = new Server(server, { cors: { origin: frontendOrigin } });
const port = process.env.PORT;

connectDB();

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
app.use("/api", routes);

app.set("io", io);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/upload-demo.html");
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (e) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.join("user:" + socket.userId);
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
