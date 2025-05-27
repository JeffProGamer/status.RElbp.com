const http = require("http");
const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const PORT = process.env.PORT || 3000;
const STATUS_URL = "https://status-lbp-com.onrender.com";
let lastSnapshot = "";

async function fetchStatus() {
    try {
        const response = await axios.get(STATUS_URL);
        const $ = cheerio.load(response.data);

        // Grab only the status section
        const statusSection = $(".status__group").parent().html();

        if (statusSection !== lastSnapshot) {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] Status Changed:\n${statusSection.replace(/<[^>]+>/g, "").trim()}\n\n`;
            fs.appendFileSync("log.txt", logEntry);
            lastSnapshot = statusSection;
        }

        return statusSection;
    } catch (err) {
        return `<p style="color:red">Error fetching status: ${err.message}</p>`;
    }
}

http.createServer(async (req, res) => {
    const statusHTML = await fetchStatus();
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="refresh" content="60" />
        <title>LittleBigPlanet Live Server Status</title>
        <style>
            body { background-color: #0d0d0d; color: #fff; font-family: 'Segoe UI', sans-serif; margin: 40px; }
            h1 { color: #00ff88; }
            .status { background: #1a1a1a; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px #00ff88; }
            .updated { font-size: 0.85em; color: #ccc; margin-top: 20px; }
        </style>
    </head>
    <body>
        <h1>LittleBigPlanet Server Status</h1>
        <div class="status">${statusHTML}</div>
        <div class="updated">Last checked: ${new Date().toLocaleString()}</div>
    </body>
    </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
}).listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Recheck every 60 seconds
setInterval(fetchStatus, 60000);
