const http = require("http");
const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const PORT = 3000;
const STATUS_URL = "http://status.lbp.com/";
let lastContent = "";

async function fetchAndLogStatus() {
    try {
        const response = await axios.get(STATUS_URL);
        const $ = cheerio.load(response.data);
        const bodyText = $("body").text().trim();

        if (bodyText !== lastContent) {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] Status Changed:\n${bodyText}\n\n`;
            fs.appendFileSync("log.txt", logEntry);
            lastContent = bodyText;
        }

        return bodyText;
    } catch (err) {
        console.error("Error fetching status:", err.message);
        return "Error fetching status.";
    }
}

// Serve HTML with live status
http.createServer(async (req, res) => {
    if (req.url === "/") {
        const statusText = await fetchAndLogStatus();

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>LBP Status</title>
                <meta http-equiv="refresh" content="60">
                <style>
                    body { font-family: Arial; padding: 20px; background: #111; color: #0f0; }
                    h1 { color: #0f0; }
                    pre { white-space: pre-wrap; word-wrap: break-word; }
                </style>
            </head>
            <body>
                <h1>LittleBigPlanet Live Status</h1>
                <pre>${statusText}</pre>
                <p>Last updated: ${new Date().toLocaleString()}</p>
            </body>
            </html>
        `;

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    } else {
        res.writeHead(404);
        res.end("Not Found");
    }
}).listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Poll every 60 seconds
setInterval(fetchAndLogStatus, 60 * 1000);
