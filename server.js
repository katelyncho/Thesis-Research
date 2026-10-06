// Zero-dependency local server. Run: node server.js  ->  http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const PAGE = path.join(__dirname, "index.html");
const OUT_FILE = path.join(__dirname, "responses.jsonl"); // one JSON object per line, append-only

http
  .createServer((req, res) => {
    if (
      req.method === "GET" &&
      (req.url === "/" || req.url === "/index.html")
    ) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return fs.createReadStream(PAGE).pipe(res);
    }

    if (req.method === "GET" && req.url === "/style.css") {
      res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
      return fs.createReadStream(path.join(__dirname, "style.css")).pipe(res);
    }

    if (req.method === "POST" && req.url === "/submit") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 1e6) req.destroy(); // ignore absurdly large payloads
      });
      req.on("end", () => {
        try {
          const answers = JSON.parse(body);
          if (!Array.isArray(answers))
            throw new Error("answers must be an array");
          const record = { submittedAt: new Date().toISOString(), answers };
          fs.appendFileSync(OUT_FILE, JSON.stringify(record) + "\n"); // never overwrites old data
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  })
  .listen(PORT, () =>
    console.log(
      `Survey running at http://localhost:${PORT}\nAnswers are saved to ${OUT_FILE}`,
    ),
  );
