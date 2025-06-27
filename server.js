const express = require("express");
const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");
const fetch = require("node-fetch");
const axios = require("axios");
const cheerio = require("cheerio");

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
  const now = Date.now();
  timeline.push({ time: now, value });
  timeline = timeline.slice(-60); // last 60 updates
  fs.writeFileSync(STATUS_FILE, JSON.stringify(timeline));

  const totalTime = (timeline[timeline.length - 1].time - timeline[0].time) || 1;
  let upTime = 0;
  for (let i = 1; i < timeline.length; i++) {
    const duration = timeline[i].time - timeline[i - 1].time;
    if (timeline[i - 1].value === 100) upTime += duration;
  }
  const percent = ((upTime / totalTime) * 100).toFixed(2);
  io.emit("timeline", { timeline, percent });
}

// Scrape lbpunion.com every 60s for unofficial status
async function checkLBPUnion() {
  try {
    const res = await axios.get("https://lbpunion.com/status");
    const $ = cheerio.load(res.data);
    const text = $("body").text().toLowerCase();
    const isUp = text.includes("all servers online");
    updateTimeline(isUp ? 100 : 0);
  } catch (e) {
    console.error("Failed to fetch lbpunion.com:", e.message);
    updateTimeline(0);
  }
}
setInterval(checkLBPUnion, 60000);

io.on("connection", socket => {
  console.log("Client connected");
  if (fs.existsSync(STATUS_FILE)) {
    try {
      const timeline = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
      const totalTime = (timeline[timeline.length - 1].time - timeline[0].time) || 1;
      let upTime = 0;
      for (let i = 1; i < timeline.length; i++) {
        const duration = timeline[i].time - timeline[i - 1].time;
        if (timeline[i - 1].value === 100) upTime += duration;
      }
      const percent = ((upTime / totalTime) * 100).toFixed(2);
      socket.emit("timeline", { timeline, percent });
    } catch {}
  }
});

server.listen(PORT, () => console.log(`LBP real status tracker on http://localhost:${PORT}`));
