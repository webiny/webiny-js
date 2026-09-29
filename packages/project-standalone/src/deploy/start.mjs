// Standalone launcher for a deployed server build/ folder. handler.mjs only EXPORTS the (async)
// handler; this imports it and listens. Copied verbatim into build/ by EmitDeployEntry. Mirrors the
// dev apiServerRunner (prefer the telemetry-wrapped _handler.mjs when present), build/-relative.
import fs from "node:fs";

const wrapped = new URL("./_handler.mjs", import.meta.url);
const plain = new URL("./handler.mjs", import.meta.url);
const target = fs.existsSync(wrapped) ? wrapped : plain;

const { handler } = await import(target.href);
const server = await handler;

const port = Number(process.env.PORT || 3002);
server.listen(port, () => console.log("listening on http://localhost:" + port));
