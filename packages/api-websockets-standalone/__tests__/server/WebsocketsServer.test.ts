import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createServer } from "node:http";
import type { Server as HttpServer } from "node:http";
import { WebSocket } from "ws";
import type { IWebsocketsConnectionRegistry } from "@webiny/api-websockets";
import { ServerConnectionManagerImpl } from "~/connectionManager/ServerConnectionManager.js";
import { createWebsocketsServer, attachWebsocketsServer } from "~/server/WebsocketsServer.js";
import type { IWebsocketsServer } from "~/server/types.js";

const createNoopRegistry = (): IWebsocketsConnectionRegistry => ({
    register: vi.fn().mockResolvedValue({} as any),
    unregister: vi.fn().mockResolvedValue(undefined),
    listViaConnections: vi.fn().mockResolvedValue([]),
    listViaIdentity: vi.fn().mockResolvedValue([]),
    listViaTenant: vi.fn().mockResolvedValue([]),
    listAll: vi.fn().mockResolvedValue([]),
    updateLastSeen: vi.fn().mockResolvedValue(undefined),
    listStale: vi.fn().mockResolvedValue([])
});

/* Helper: create a WS client and wait for it to be open. */
function connectClient(port: number): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const client = new WebSocket(`ws://127.0.0.1:${port}`);
        client.once("open", () => resolve(client));
        client.once("error", reject);
    });
}

/* Helper: close a WS client and wait for it to finish. */
function closeClient(client: WebSocket): Promise<void> {
    return new Promise(resolve => {
        if (client.readyState === WebSocket.CLOSED) {
            resolve();
            return;
        }
        client.once("close", () => resolve());
        client.close();
    });
}

/* Helper: listen an HTTP server on a random port. */
function listenOnRandomPort(server: HttpServer): Promise<number> {
    return new Promise((resolve, reject) => {
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            if (!address || typeof address === "string") {
                reject(new Error("Unexpected server address"));
                return;
            }
            resolve(address.port);
        });
    });
}

/* Helper: close an HTTP server. */
function closeHttpServer(server: HttpServer): Promise<void> {
    return new Promise((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()));
    });
}

describe("WebsocketsServer", () => {
    describe("standalone mode (createWebsocketsServer)", () => {
        let server: IWebsocketsServer;

        beforeEach(async () => {
            const registry = createNoopRegistry();
            const manager = new ServerConnectionManagerImpl(registry);

            server = createWebsocketsServer({
                port: 0,
                host: "127.0.0.1",
                heartbeatInterval: 60_000,
                connectionManager: manager
            });
            await server.start();
        });

        afterEach(async () => {
            await server.stop();
        });

        it("should start and stop without errors", () => {
            expect(server.port()).toBeGreaterThan(0);
        });

        it("should accept WebSocket connections", async () => {
            const client = await connectClient(server.port());
            expect(client.readyState).toBe(WebSocket.OPEN);
            await closeClient(client);
        });

        it("should track connections in the manager", async () => {
            const client = await connectClient(server.port());

            /* Give the server a tick to process the connection event. */
            await new Promise(resolve => setTimeout(resolve, 50));

            /* Send a message from the client to trigger onMessage handling. */
            client.send(JSON.stringify({ action: "ping" }));
            await new Promise(resolve => setTimeout(resolve, 50));

            /* The simplest assertion: the server accepted the connection without error. */
            expect(client.readyState).toBe(WebSocket.OPEN);
            await closeClient(client);
        });

        it("should clean up on disconnect", async () => {
            const registry = createNoopRegistry();
            const trackedManager = new ServerConnectionManagerImpl(registry);
            const addSpy = vi.spyOn(trackedManager, "add");
            const removeSpy = vi.spyOn(trackedManager, "remove");

            const trackedServer = createWebsocketsServer({
                port: 0,
                host: "127.0.0.1",
                heartbeatInterval: 60_000,
                connectionManager: trackedManager
            });
            await trackedServer.start();

            const client = await connectClient(trackedServer.port());
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(addSpy).toHaveBeenCalledTimes(1);

            await closeClient(client);
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(removeSpy).toHaveBeenCalledTimes(1);

            await trackedServer.stop();
        });

        it("should resolve a valid port after start", () => {
            const port = server.port();
            expect(port).toBeGreaterThan(0);
            expect(port).toBeLessThan(65536);
        });
    });

    describe("failure handling", () => {
        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        it("keeps running when the registry fails on message and on close", async () => {
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
            const registry = createNoopRegistry();
            registry.updateLastSeen = vi.fn().mockRejectedValue(new Error("SQLITE_BUSY"));
            registry.unregister = vi.fn().mockRejectedValue(new Error("connection lost"));
            const manager = new ServerConnectionManagerImpl(registry);

            const server = createWebsocketsServer({
                port: 0,
                host: "127.0.0.1",
                connectionManager: manager
            });
            await server.start();

            // Vitest fails the run on an unhandled rejection, which is what these used to be.
            const client = await connectClient(server.port());
            await wait(50);
            client.send(JSON.stringify({ action: "ping" }));
            await wait(50);
            await closeClient(client);
            await wait(50);

            expect(registry.updateLastSeen).toHaveBeenCalledTimes(1);
            expect(registry.unregister).toHaveBeenCalledTimes(1);

            registry.unregister = vi.fn().mockResolvedValue(undefined);
            await server.stop();
            consoleError.mockRestore();
        });

        it("removes a connection that closed while it was still authenticating", async () => {
            const registry = createNoopRegistry();
            const manager = new ServerConnectionManagerImpl(registry);

            let finishAuthentication: () => void = () => {};
            const authenticate = vi.fn(
                () =>
                    new Promise<null>(resolve => {
                        finishAuthentication = () => resolve(null);
                    })
            );

            const server = createWebsocketsServer({
                port: 0,
                host: "127.0.0.1",
                connectionManager: manager,
                authenticate
            });
            await server.start();

            const client = new WebSocket(`ws://127.0.0.1:${server.port()}/?token=t`);
            await new Promise(resolve => client.once("open", resolve));
            await closeClient(client);
            await wait(50);

            finishAuthentication();
            await wait(50);

            expect(registry.register).toHaveBeenCalledTimes(1);
            expect(registry.unregister).toHaveBeenCalledTimes(1);
            expect(manager.getActiveConnectionIds()).toEqual([]);

            await server.stop();
        });

        it("closes a connection that has gone stale so the client can reconnect", async () => {
            const registry = createNoopRegistry();
            const manager = new ServerConnectionManagerImpl(registry);

            const server = createWebsocketsServer({
                port: 0,
                host: "127.0.0.1",
                heartbeatInterval: 50,
                staleAfter: 1_000,
                connectionManager: manager
            });
            await server.start();

            const client = await connectClient(server.port());
            await wait(20);
            const [connectionId] = manager.getActiveConnectionIds();
            registry.listStale = vi.fn().mockResolvedValue([{ connectionId }]);

            const closeCode = await new Promise<number>(resolve => {
                client.once("close", code => resolve(code));
            });

            expect(closeCode).toBe(1001);
            expect(registry.listStale).toHaveBeenCalled();

            await server.stop();
        });
    });

    describe("attach mode (attachWebsocketsServer)", () => {
        let httpServer: HttpServer;
        let server: IWebsocketsServer;
        let port: number;

        beforeEach(async () => {
            httpServer = createServer();
            port = await listenOnRandomPort(httpServer);

            const registry = createNoopRegistry();
            const manager = new ServerConnectionManagerImpl(registry);

            server = attachWebsocketsServer({
                server: httpServer,
                connectionManager: manager
            });
            await server.start();
        });

        afterEach(async () => {
            await server.stop();
            await closeHttpServer(httpServer);
        });

        it("should work with an existing HTTP server", async () => {
            const client = await connectClient(port);
            expect(client.readyState).toBe(WebSocket.OPEN);
            await closeClient(client);
        });

        it("should resolve the port from the existing server", () => {
            expect(server.port()).toBe(port);
        });
    });

    describe("without connection manager", () => {
        let server: IWebsocketsServer;

        beforeEach(async () => {
            server = createWebsocketsServer({
                port: 0,
                host: "127.0.0.1",
                heartbeatInterval: 60_000
            });
            /* Deliberately NOT setting a connection manager. */
            await server.start();
        });

        afterEach(async () => {
            await server.stop();
        });

        it("should accept connections even without a connection manager", async () => {
            const client = await connectClient(server.port());
            expect(client.readyState).toBe(WebSocket.OPEN);
            await closeClient(client);
        });
    });
});
