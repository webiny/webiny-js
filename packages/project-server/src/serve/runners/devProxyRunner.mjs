// Spawned by `runDevProxy` from inside project-server's own build (unlike the api/admin runners,
// this one isn't copied into an app workspace — the proxy belongs to no app). That means it can just
// import the implementation rather than inline it, so the routing, streaming and upgrade handling
// stay in plain TypeScript with tests around them.
import { startDevProxy } from "../devServer/startDevProxy.js";

const proxy = await startDevProxy({
  port: Number(process.env.PORT),
  apiPort: Number(process.env.WEBINY_PROXY_API_PORT),
  adminPort: Number(process.env.WEBINY_PROXY_ADMIN_PORT)
});

console.log("Webiny dev proxy listening on " + proxy.url);

const shutdown = () => {
  proxy.close().then(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
