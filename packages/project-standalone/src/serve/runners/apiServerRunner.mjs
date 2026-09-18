import fs from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

// Copied verbatim into `<workspace>/apps/api/.serve.mjs` by project-server, then run (under Node's
// `--watch` for dev, or once for `serve`). PORT is injected via env.
const port = Number(process.env.PORT || 3002);

// Deploy/WCP builds rename the app handler to `_handler.mjs` and put a telemetry wrapper at
// `handler.mjs`; dev/watch builds have no telemetry and emit a plain `handler.mjs`. Prefer the
// un-wrapped server handler when present, else the plain one.
const wrapped = new URL("./graphql/build/_handler.mjs", import.meta.url);
const plain = new URL("./graphql/build/handler.mjs", import.meta.url);
const resolveTarget = () =>
  fs.existsSync(wrapped) ? wrapped : fs.existsSync(plain) ? plain : null;

// On the very first watch run the build may not have landed yet. Wait for it instead of throwing
// ERR_MODULE_NOT_FOUND, which `--watch` would surface as a scary crash + stack trace before retrying.
let target = resolveTarget();
if (!target) {
  console.log("waiting for first build…");
  while (!target) {
    await sleep(200);
    target = resolveTarget();
  }
}

// The handler is created asynchronously (the server builds its root container + attaches the
// WebSockets upgrade handler at startup), so await it before listening.
const { handler } = await import(target.href);
const server = await handler;

server.listen(port, () => {
  console.log("listening on http://localhost:" + port);
});
