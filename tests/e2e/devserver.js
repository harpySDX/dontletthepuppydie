// Local dev server for browser tests (NOT for production): static files + /api/tutor with the real handler and a MOCKED Anthropic call.
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const OUT = process.env.E2E_OUT || require("os").tmpdir();
process.env.ANTHROPIC_API_KEY = process.env.MOCK_OFF ? "" : "test-key";
const handler = require(ROOT + "/api/tutor.js");
global.LAST = null;
const realFetch = global.fetch;
global.fetch = async (url, opts) => {
  const body = JSON.parse(opts.body);
  global.LAST = body;
  fs.writeFileSync(path.join(OUT, "last-request.json"), JSON.stringify(body, null, 1));
  const last = body.messages[body.messages.length - 1].content;
  return { ok: true, status: 200, json: async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: `MOCK reply to: ${last.slice(0, 60)}\n\nUse \\(\\sqrt{12} = 2\\sqrt{3}\\).` }] }) };
};
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json" };
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/api/tutor") {
    let data = ""; req.on("data", (c) => (data += c)); req.on("end", () => { req.body = data ? JSON.parse(data) : undefined; handler(req, res); });
    return;
  }
  let p = path.join(ROOT, decodeURIComponent(u.pathname)); if (p.endsWith("/")) p += "index.html";
  fs.readFile(p, (e, d) => { if (e) { res.statusCode = 404; return res.end("nf"); } res.setHeader("Content-Type", types[path.extname(p)] || "application/octet-stream"); res.end(d); });
}).listen(process.env.PORT || 8766, () => console.log("up"));
