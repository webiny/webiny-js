import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    prepareDevServerSession,
    type IPrepareDevServerSessionParams
} from "~/serve/devServer/prepareDevServerSession.js";
import { startDevProxy } from "~/serve/devServer/startDevProxy.js";
import { isPortFree } from "~/serve/findFreePort.js";

const MANAGED_VARS = [
    "PORT",
    "WEBINY_PORT",
    "WEBINY_PROXY",
    "WEBINY_API_PORT",
    "WEBINY_ADMIN_PORT",
    "WEBINY_API_URL",
    "WEBINY_ADMIN_API_URL",
    "WEBINY_ADMIN_WS_API_URL"
];

describe("prepareDevServerSession", () => {
    let rootFolder: string;
    let originalEnv: Record<string, string | undefined>;

    beforeEach(() => {
        rootFolder = fs.mkdtempSync(path.join(os.tmpdir(), "webiny-dev-server-"));
        originalEnv = Object.fromEntries(MANAGED_VARS.map(name => [name, process.env[name]]));
        for (const name of MANAGED_VARS) {
            delete process.env[name];
        }
    });

    afterEach(() => {
        for (const [name, value] of Object.entries(originalEnv)) {
            if (value === undefined) {
                delete process.env[name];
            } else {
                process.env[name] = value;
            }
        }
        fs.rmSync(rootFolder, { recursive: true, force: true });
    });

    const prepare = (params: Partial<IPrepareDevServerSessionParams> = {}) =>
        prepareDevServerSession({
            apps: ["api", "admin"],
            pointAppsAtProxy: true,
            rootFolder,
            ...params
        });

    describe("deciding whether a proxy belongs in front", () => {
        it("does nothing for a single app, which already has a single URL", async () => {
            expect(await prepare({ apps: ["api"] })).toBeNull();

            expect(process.env.WEBINY_API_PORT).toBeUndefined();
            expect(process.env.WEBINY_ADMIN_API_URL).toBeUndefined();
        });

        it("does nothing when asked not to, by flag or by env", async () => {
            expect(await prepare({ enabled: false })).toBeNull();

            process.env.WEBINY_PROXY = "off";
            expect(await prepare()).toBeNull();

            expect(process.env.WEBINY_ADMIN_API_URL).toBeUndefined();
        });
    });

    describe("ports", () => {
        it("gives every app a port of its own, and none of them the proxy's", async () => {
            const session = await prepare();

            const apiPort = Number(process.env.WEBINY_API_PORT);
            const adminPort = Number(process.env.WEBINY_ADMIN_PORT);

            expect(session).not.toBeNull();
            expect(apiPort).not.toBe(adminPort);
            expect([apiPort, adminPort]).not.toContain(session!.port);
        });

        it("takes over PORT rather than leaving it for an app to grab as well", async () => {
            const port = await freePort();
            process.env.PORT = String(port);

            const session = await prepare();

            expect(session!.port).toBe(port);
            // Both app runners fall back to PORT, and two servers honouring one port means one of
            // them quietly fails to bind.
            expect(process.env.PORT).toBeUndefined();
        });

        it("prefers WEBINY_PORT over PORT", async () => {
            const preferred = await freePort();
            process.env.WEBINY_PORT = String(preferred);
            process.env.PORT = String(await freePort(preferred + 1));

            expect((await prepare())!.port).toBe(preferred);
        });

        it("leaves a pinned app port alone", async () => {
            const pinned = await freePort();
            process.env.WEBINY_API_PORT = String(pinned);

            await prepare();

            expect(Number(process.env.WEBINY_API_PORT)).toBe(pinned);
        });

        it("comes back on the same port next time, so the URL keeps working", async () => {
            const first = await prepare();

            delete process.env.PORT;
            const second = await prepare();

            expect(second!.port).toBe(first!.port);
        });

        it("moves off a remembered port that something else has taken", async () => {
            const first = await prepare();

            const squatter = await occupy(first!.port);
            try {
                const second = await prepare();
                expect(second!.port).not.toBe(first!.port);
            } finally {
                await squatter();
            }
        });
    });

    it("hands the proxy the ports it reserved, end to end", async () => {
        const session = await prepare();
        const { apiPort, adminPort } = session!.targets;

        const api = await serve("api answered");
        const admin = await serve("admin answered");
        const proxy = await startDevProxy({ port: session!.port, apiPort, adminPort });

        try {
            await api.listenOn(apiPort);
            await admin.listenOn(adminPort);

            expect(await (await fetch(session!.apiUrl + "/graphql")).text()).toBe("api answered");
            expect(await (await fetch(session!.url + "/")).text()).toBe("admin answered");
        } finally {
            await proxy.close();
            await api.close();
            await admin.close();
        }
    });

    describe("the URLs it points the apps at", () => {
        it("gives admin a relative API URL, so the bundle works on any origin", async () => {
            await prepare();

            // Not `http://localhost:<port>/api`: resolved in the browser instead, which is what lets
            // the same build run behind a portless domain or a real reverse proxy.
            expect(process.env.WEBINY_ADMIN_API_URL).toBe("/api");
        });

        it("points the admin websocket at itself too", async () => {
            await prepare();

            // `<Admin.WebsocketsUrl>` beats the API URL when a project sets it, and pinning it to a
            // port is the obvious thing to write, so leaving this unset sends the socket elsewhere.
            expect(process.env.WEBINY_ADMIN_WS_API_URL).toBe("/api");
        });

        it("gives the api an absolute one, since it hands out URLs to clients", async () => {
            const session = await prepare();

            expect(process.env.WEBINY_API_URL).toBe(`${session!.url}/api`);
            expect(session!.apiUrl).toBe(`http://localhost:${session!.port}/api`);
        });

        it("takes over the admin URLs, because by now the config has already set them", async () => {
            // `<Admin.ApiUrl>` emits an env var, and webiny.config was evaluated before the command
            // handler ran, so filling in blanks would never win. Pointing admin anywhere other than
            // the proxy is broken while the proxy is in front, so the proxy owns these; `--no-proxy`
            // is the way out. AWS does the same in SetAdminEnvVarsBeforeWatch.
            process.env.WEBINY_ADMIN_API_URL = "http://localhost:3002";
            process.env.WEBINY_ADMIN_WS_API_URL = "ws://localhost:3002";

            await prepare();

            expect(process.env.WEBINY_ADMIN_API_URL).toBe("/api");
            expect(process.env.WEBINY_ADMIN_WS_API_URL).toBe("/api");
        });

        it("leaves every URL alone when only reserving ports", async () => {
            // `serve` runs what `webiny build` produced, so the admin bundle's URL is already fixed
            // and setting anything now would only be misleading.
            const session = await prepare({ pointAppsAtProxy: false });

            expect(session).not.toBeNull();
            expect(process.env.WEBINY_ADMIN_API_URL).toBeUndefined();
            expect(process.env.WEBINY_API_URL).toBeUndefined();
            expect(Number(process.env.WEBINY_API_PORT)).toBe(session!.targets.apiPort);
        });
    });
});

async function freePort(from = 48000 + Math.floor(Math.random() * 1000)) {
    const { findFreePort } = await import("~/serve/findFreePort.js");
    return findFreePort(from);
}

/** A server that answers everything with `body`, started on demand on a given port. */
async function serve(body: string) {
    const http = await import("node:http");
    const server = http.createServer((_req, res) => res.end(body));

    return {
        listenOn: (port: number) => new Promise<void>(resolve => server.listen(port, resolve)),
        close: () =>
            new Promise<void>(resolve => {
                server.closeAllConnections();
                server.close(() => resolve());
            })
    };
}

/** Holds a port open, and returns how to let it go. */
async function occupy(port: number) {
    const net = await import("node:net");
    const server = net.createServer();
    await new Promise<void>(resolve => server.listen(port, () => resolve()));
    expect(await isPortFree(port)).toBe(false);
    return () => new Promise<void>(resolve => server.close(() => resolve()));
}
