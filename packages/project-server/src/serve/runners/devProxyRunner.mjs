/*
 * Spawned by `spawnDevProxy`, and a hand-written `.mjs` like `apiServerRunner` and `adminServerRunner`
 * next to it.
 *
 * Unlike those two it is never copied into an app workspace, because the proxy belongs to no app. It
 * runs from project-server's own build instead, which is why it can import `DevProxy` rather than
 * inlining a server the way they have to.
 */
import { DevProxy } from "../devProxy/DevProxy.js";

const proxy = await DevProxy.start({
  port: Number(process.env.PORT),
  apiPort: Number(process.env.WEBINY_PROXY_API_PORT),
  adminPort: Number(process.env.WEBINY_PROXY_ADMIN_PORT)
});

console.log(`Webiny dev proxy listening on ${proxy.url}`);

const shutdown = () => {
  proxy.close().then(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
