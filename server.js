const express = require("express");
const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
app.use(express.static("public"));

const STATUS_FILE = "status.json";

function broadcastStatus() {
  fs.readFile(STATUS_FILE, "utf-8", (err, data) => {
    if (!err) {
      try {
        const status = JSON.parse(data);
        io.emit("status", status);
      } catch {}
    }
  });
}

setInterval(broadcastStatus, 2000);

io.on("connection", socket => {
  console.log("Client connected");
  broadcastStatus();
});

server.listen(PORT, () => {
  console.log(`Dashboard running on http://localhost:${PORT}`);
});
