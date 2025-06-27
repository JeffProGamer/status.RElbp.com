const express = require("express");
const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");
const fetch = require("node-fetch");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
app.use(express.static("public"));

const STATUS_FILE = "timeline.json";

function updateTimeline(value) {
  let timeline = [];
  if (fs.existsSync(STATUS_FILE)) {
    try { timeline = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8")); } catch {}
  }
  timeline.push({ time: Date.now(), value });
  timeline = timeline.slice(-60); // last 60 updates (~5min at 5s interval)
  fs.writeFileSync(STATUS_FILE, JSON.stringify(timeline));
  io.emit("timeline", timeline);
}

setInterval(async () => {
  try {
    const res = await fetch("http://example.com/ping"); // replace with real server
    updateTimeline(res.ok ? 100 : 0);
  } catch { updateTimeline(0); }
}, 5000);

io.on("connection", socket => {
  console.log("Client connected");
  if (fs.existsSync(STATUS_FILE)) {
    try {
      const timeline = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
      socket.emit("timeline", timeline);
    } catch {}
  }
});

server.listen(PORT, () => console.log(`LBP timeline status on http://localhost:${PORT}`));
