// Spawned by `runDevProxy`. Unlike the api and admin runners next to it, this one is never copied
// into an app workspace (the proxy belongs to no app), so it runs from project-server's own build
// and is plain TypeScript like everything else. It imports the implementation rather than inlining
// it, which is the whole reason it can stay this small.
import { startDevProxy } from "../devServer/startDevProxy.js";

const proxy = await startDevProxy({
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
