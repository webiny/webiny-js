import http from "node:http";
import { type AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { startDevProxy, type IDevProxy } from "~/serve/devProxy/startDevProxy.js";
import { findFreePort } from "~/serve/findFreePort.js";

interface IRecordedRequest {
    url: string | undefined;
    method: string | undefined;
    headers: http.IncomingHttpHeaders;
    body: string;
}

/** A stand-in upstream that records what the proxy forwarded and answers however the test needs. */
function createUpstream(handler: http.RequestListener) {
    const requests: IRecordedRequest[] = [];
    // Upgraded sockets detach from the server, so `close` neither waits for them nor ends them.
    const sockets = new Set<import("node:net").Socket>();

    const server = http.createServer((req, res) => {
        let body = "";
        req.on("data", chunk => (body += chunk));
        req.on("end", () => {
            requests.push({ url: req.url, method: req.method, headers: req.headers, body });
        });
        handler(req, res);
    });

    server.on("connection", socket => {
        sockets.add(socket);
        socket.once("close", () => sockets.delete(socket));
    });

    return {
        requests,
        server,
        listen: () =>
            new Promise<number>(resolve => {
                server.listen(0, () => resolve((server.address() as AddressInfo).port));
            }),
        close: () =>
            new Promise<void>(resolve => {
                for (const socket of sockets) {
                    socket.destroy();
                }
                server.closeAllConnections();
                server.close(() => resolve());
            })
    };
}

const echo: http.RequestListener = (req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`served ${req.url}`);
};

describe("startDevProxy", () => {
    const cleanups: Array<() => Promise<void>> = [];

    afterEach(async () => {
        for (const cleanup of cleanups.splice(0)) {
            await cleanup();
        }
    });

    async function setup(
        options: { api?: http.RequestListener; admin?: http.RequestListener } = {}
    ) {
        const api = createUpstream(options.api ?? echo);
        const admin = createUpstream(options.admin ?? echo);

        const apiPort = await api.listen();
        const adminPort = await admin.listen();
        const port = await findFreePort(45000);

        const proxy = await startDevProxy({ port, apiPort, adminPort });

        cleanups.push(() => proxy.close(), api.close, admin.close);

        return { proxy, api, admin, port };
    }

    const get = (proxy: IDevProxy, path: string, init: RequestInit = {}) =>
        fetch(`${proxy.url}${path}`, init);

    it("routes everything without the /api prefix to admin", async () => {
        const { proxy, admin, api } = await setup();

        const response = await get(proxy, "/website-builder/pages");

        expect(await response.text()).toBe("served /website-builder/pages");
        expect(admin.requests).toHaveLength(1);
        expect(api.requests).toHaveLength(0);
    });

    it("routes /api to the api with the prefix stripped", async () => {
        const { proxy, api, admin } = await setup();

        expect(await (await get(proxy, "/api/graphql")).text()).toBe("served /graphql");
        expect(await (await get(proxy, "/api/files/some-key.png")).text()).toBe(
            "served /files/some-key.png"
        );
        // The bare prefix is still the api's root, not an empty path.
        expect(await (await get(proxy, "/api")).text()).toBe("served /");

        expect(admin.requests).toHaveLength(0);
        expect(api.requests.map(request => request.url)).toEqual([
            "/graphql",
            "/files/some-key.png",
            "/"
        ]);
    });

    it("does not mistake an admin route that merely starts with the same letters", async () => {
        const { proxy, admin, api } = await setup();

        await get(proxy, "/api-playground");

        expect(admin.requests.map(request => request.url)).toEqual(["/api-playground"]);
        expect(api.requests).toHaveLength(0);
    });

    it("tells the api what origin and prefix the client actually used", async () => {
        const { proxy, api, admin } = await setup();

        await get(proxy, "/api/graphql");
        await get(proxy, "/index.html");

        expect(api.requests[0].headers["x-forwarded-prefix"]).toBe("/api");
        expect(api.requests[0].headers["x-forwarded-proto"]).toBe("http");
        expect(api.requests[0].headers["x-forwarded-host"]).toBe(new URL(proxy.url).host);
        // Admin serves static files at the root, so there is no prefix to put back.
        expect(admin.requests[0].headers["x-forwarded-prefix"]).toBeUndefined();
    });

    it("keeps an outer proxy's forwarding headers rather than claiming to be the origin", async () => {
        const { proxy, api } = await setup();

        await get(proxy, "/api/graphql", {
            headers: {
                "x-forwarded-host": "wby6.localhost",
                "x-forwarded-proto": "https"
            }
        });

        expect(api.requests[0].headers["x-forwarded-host"]).toBe("wby6.localhost");
        expect(api.requests[0].headers["x-forwarded-proto"]).toBe("https");
    });

    it("streams request bodies through, with no size limit of its own", async () => {
        const { proxy, api } = await setup({
            // Answer only once the whole body has arrived, so the assertions below can't race the
            // upstream still reading it.
            api: (req, res) => req.on("end", () => res.writeHead(201).end("uploaded"))
        });

        // Comfortably past anything that would fit in a single chunk.
        const payload = "x".repeat(3 * 1024 * 1024);
        const response = await get(proxy, "/api/webiny-file-upload", {
            method: "POST",
            body: payload
        });

        expect(response.status).toBe(201);
        expect(api.requests[0].method).toBe("POST");
        expect(api.requests[0].body).toHaveLength(payload.length);
    });

    it("passes server-sent events on as they happen instead of buffering the response", async () => {
        let send: (data: string) => void = () => undefined;
        let finish: () => void = () => undefined;

        const { proxy } = await setup({
            api: (_req, res) => {
                res.writeHead(200, {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache"
                });
                // Node holds headers back until the first write; a real SSE endpoint flushes them so
                // the client can start reading before there is anything to read.
                res.flushHeaders();
                send = data => res.write(`data: ${data}\n\n`);
                finish = () => res.end();
            }
        });

        const response = await get(proxy, "/api/stream/fm/files/1/enrich");
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        // The first event has to arrive while the response is still open. If the proxy buffered, this
        // read would block until `finish()` below.
        send("first");
        expect(decoder.decode((await reader.read()).value)).toBe("data: first\n\n");

        send("second");
        expect(decoder.decode((await reader.read()).value)).toBe("data: second\n\n");

        finish();
        expect((await reader.read()).done).toBe(true);
    });

    it("waits for a target that is still restarting instead of failing the request", async () => {
        const api = createUpstream(echo);
        const admin = createUpstream(echo);

        const adminPort = await admin.listen();
        // Reserve a port for the api, then leave nothing listening on it: this is what a request
        // landing mid-rebuild sees, since the api runs under `node --watch`.
        const apiPort = await findFreePort(46000);
        const port = await findFreePort(45500);

        const proxy = await startDevProxy({ port, apiPort, adminPort });
        cleanups.push(() => proxy.close(), api.close, admin.close);

        const pending = get(proxy, "/api/graphql");

        await new Promise(resolve => setTimeout(resolve, 300));
        await new Promise<void>(resolve => api.server.listen(apiPort, () => resolve()));

        const response = await pending;
        expect(response.status).toBe(200);
        expect(await response.text()).toBe("served /graphql");
    });

    it("answers with a readable error once a target has clearly not come back", async () => {
        const admin = createUpstream(echo);
        const adminPort = await admin.listen();
        const apiPort = await findFreePort(46500);
        const port = await findFreePort(45800);

        // Nothing will ever listen on apiPort, so shorten the wait rather than sit here for 20s.
        const proxy = await startDevProxy({ port, apiPort, adminPort, targetWait: 300 });
        cleanups.push(() => proxy.close(), admin.close);

        const response = await get(proxy, "/api/graphql");

        expect(response.status).toBe(503);
        expect(await response.text()).toContain("api server is not responding");
    });

    it("forwards websocket upgrades, in both directions", async () => {
        // A raw upgrade rather than a websocket client: what matters here is that the proxy relays the
        // 101 and then gets out of the way, which is protocol-agnostic.
        const upstream = createUpstream(echo);
        upstream.server.on("upgrade", (req, socket) => {
            socket.write(
                "HTTP/1.1 101 Switching Protocols\r\n" +
                    "Upgrade: websocket\r\n" +
                    "Connection: Upgrade\r\n" +
                    `X-Seen-Path: ${req.url}\r\n\r\n`
            );
            socket.on("data", data => socket.write(`echo:${data.toString()}`));
        });

        const upstreamPort = await upstream.listen();
        const wsProxy = await startDevProxy({
            port: await findFreePort(47000),
            apiPort: upstreamPort,
            adminPort: upstreamPort
        });
        cleanups.push(() => wsProxy.close(), upstream.close);

        const { head, firstMessage } = await new Promise<{ head: string; firstMessage: string }>(
            (resolve, reject) => {
                const request = http.request({
                    port: new URL(wsProxy.url).port,
                    path: "/api/ws",
                    headers: { Connection: "Upgrade", Upgrade: "websocket" }
                });

                request.on("upgrade", (res, socket) => {
                    socket.write("ping");
                    socket.once("data", data => {
                        const message = data.toString();
                        socket.destroy();
                        resolve({
                            head: String(res.headers["x-seen-path"]),
                            firstMessage: message
                        });
                    });
                });
                request.on("error", reject);
                request.end();
            }
        );

        // Prefix stripped on the upgrade too, not just on plain requests.
        expect(head).toBe("/ws");
        expect(firstMessage).toBe("echo:ping");
    });
});
