import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Copied verbatim into `<workspace>/apps/admin/.serve.mjs` by project-server, then run to serve the
// admin SPA build (`./build`) as static files. PORT is injected via env. No SSR — pure static host
// with client-side-routing fallback, equivalent to what nginx/CDN would do.
const port = Number(process.env.PORT || 3001);
const root = fileURLToPath(new URL("./build", import.meta.url));
const indexHtml = path.join(root, "index.html");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8"
};

function send(res, status, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const isHtml = ext === ".html";
  res.writeHead(status, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    // Rsbuild hashes asset filenames, so they're safe to cache forever. HTML must always
    // revalidate so a new deploy is picked up immediately.
    "Cache-Control": isHtml ? "no-cache" : "public, max-age=31536000, immutable"
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const resolved = path.join(root, pathname);

  // Prevent path traversal outside the build root.
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  fs.stat(resolved, (err, stats) => {
    if (!err && stats.isFile()) {
      send(res, 200, resolved);
      return;
    }
    if (!err && stats.isDirectory()) {
      const dirIndex = path.join(resolved, "index.html");
      if (fs.existsSync(dirIndex)) {
        send(res, 200, dirIndex);
        return;
      }
    }
    // A request for a concrete asset (has a file extension) that doesn't exist is a real 404.
    // Everything else is treated as a client-side route and falls back to index.html.
    if (path.extname(pathname)) {
      res.writeHead(404).end("Not found");
      return;
    }
    send(res, 200, indexHtml);
  });
});

server.listen(port, () => {
  console.log("\n🚀 Webiny Admin (server flavour) listening on http://localhost:" + port + "\n");
});
