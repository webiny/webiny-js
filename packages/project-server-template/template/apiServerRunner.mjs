import fs from "node:fs";

// Copied verbatim into `<workspace>/apps/api/.serve.mjs` by project-server's ServerWatch, then run
// under Node's built-in `--watch` so every rebuild reboots the server. PORT is injected via env.
const port = Number(process.env.PORT || 3000);

// Deploy/WCP builds rename the app handler to `_handler.mjs` and put a telemetry wrapper at
// `handler.mjs`; dev/watch builds have no telemetry and emit a plain `handler.mjs`. Prefer the
// un-wrapped server handler when present, else the plain one.
const wrapped = new URL("./graphql/build/_handler.mjs", import.meta.url);
const plain = new URL("./graphql/build/handler.mjs", import.meta.url);
const target = fs.existsSync(wrapped) ? wrapped : plain;

const { handler } = await import(target.href);

handler.listen(port, () => {
  console.log("\n🚀 Webiny API (server flavour) listening on http://localhost:" + port + "\n");
});
