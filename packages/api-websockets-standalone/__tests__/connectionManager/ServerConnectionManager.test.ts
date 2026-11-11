import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    LAST_SEEN_WRITE_INTERVAL,
    ServerConnectionManagerImpl
} from "~/connectionManager/ServerConnectionManager.js";
import { InMemoryLiveSocketsImpl } from "~/liveSockets/InMemoryLiveSockets.js";
import { WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER } from "~/rows/WebsocketsConnectionRowsEvent.js";
import type { IWebsocketsConnectionRegistry } from "@webiny/api-websockets";
import { createConnectionManager } from "~tests/helpers/createConnectionManager.js";
import type { WebsocketsConnectionManager } from "~/abstractions.js";

const createMockRegistry = (): IWebsocketsConnectionRegistry => ({
    register: vi.fn().mockResolvedValue({}),
    unregister: vi.fn().mockResolvedValue(undefined),
    listViaConnections: vi.fn().mockResolvedValue([]),
    listViaIdentity: vi.fn().mockResolvedValue([]),
    listViaTenant: vi.fn().mockResolvedValue([]),
    listAll: vi.fn().mockResolvedValue([]),
    updateLastSeen: vi.fn().mockResolvedValue(undefined),
    listStale: vi.fn().mockResolvedValue([])
});

// The process this manager runs in, as `ProcessOwner` would name it.
const owner = { id: "host-a:1:aaaa" };

const createAddParams = (
    connectionId: string,
    socket: unknown = {}
): WebsocketsConnectionManager.AddParams<unknown> => ({
    connectionId,
    socket,
    endpoint: "ws://localhost/ws",
    identity: { id: "user-1", displayName: "User One", type: "admin" },
    tenant: "root",
    connectedAt: Date.now(),
    host: "localhost",
    headers: { "x-custom": "header" }
});

describe("ServerConnectionManager", () => {
    let registry: IWebsocketsConnectionRegistry;
    let manager: ServerConnectionManagerImpl;

    beforeEach(() => {
        registry = createMockRegistry();
        // The rows change through events, whose handler runs on a request's registry: `registry`.
        manager = createConnectionManager(registry, owner);
    });

    describe("rows", () => {
        /*
         * The manager is a root singleton, and the registry is a storage, which lives in request
         * containers: it holds no registry, and every row change is an event a fresh request runs.
         */
        it("changes the rows only by dispatching events", async () => {
            const dispatcher = { dispatch: vi.fn().mockResolvedValue(null) };
            const rootManager = new ServerConnectionManagerImpl(
                new InMemoryLiveSocketsImpl(),
                dispatcher,
                owner
            );
            const params = createAddParams("conn-events");
            const now = Date.now();
            const clock = vi.spyOn(Date, "now").mockReturnValue(now);

            await rootManager.add(params);
            clock.mockReturnValue(now + LAST_SEEN_WRITE_INTERVAL);
            await rootManager.updateLastSeen("conn-events");
            await rootManager.remove("conn-events");
            await rootManager.cleanup(900_000);

            const actions = dispatcher.dispatch.mock.calls.map(([event]) => {
                expect(event[WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER]).toBe(true);
                return event.action;
            });
            expect(actions).toEqual(["register", "updateLastSeen", "unregister", "removeStale"]);
            expect(rootManager.getSocket("conn-events")).toBeUndefined();
            clock.mockRestore();
        });
    });

    describe("add", () => {
        it("stores socket and metadata in local maps", async () => {
            const socket = { send: vi.fn() };
            const params = createAddParams("conn-1", socket);

            await manager.add(params);

            expect(manager.getSocket("conn-1")).toBe(socket);
            expect(manager.getMetadata("conn-1")).toEqual({
                connectionId: "conn-1",
                endpoint: params.endpoint,
                connectedAt: params.connectedAt,
                host: params.host,
                headers: params.headers
            });
        });

        it("registers the connection in the registry (so targeted sends can find it)", async () => {
            const params = createAddParams("conn-2");

            await manager.add(params);

            expect(registry.register).toHaveBeenCalledWith({
                connectionId: "conn-2",
                identity: params.identity,
                tenant: params.tenant,
                endpoint: params.endpoint,
                connectedOn: new Date(params.connectedAt).toISOString(),
                owner: owner.id
            });
        });
    });

    describe("remove", () => {
        it("deletes from local maps and calls registry.unregister()", async () => {
            const params = createAddParams("conn-3");
            await manager.add(params);

            await manager.remove("conn-3");

            expect(manager.getSocket("conn-3")).toBeUndefined();
            expect(manager.getMetadata("conn-3")).toBeUndefined();
            expect(registry.unregister).toHaveBeenCalledWith({ connectionId: "conn-3" });
        });

        it("swallows CONNECTION_NOT_FOUND errors from registry.unregister()", async () => {
            const error = Object.assign(new Error("Not found"), { code: "CONNECTION_NOT_FOUND" });
            vi.mocked(registry.unregister).mockRejectedValueOnce(error);

            await expect(manager.remove("conn-missing")).resolves.toBeUndefined();
        });

        it("re-throws non-CONNECTION_NOT_FOUND errors from registry.unregister()", async () => {
            const error = Object.assign(new Error("DB failure"), { code: "DB_ERROR" });
            vi.mocked(registry.unregister).mockRejectedValueOnce(error);

            await expect(manager.remove("conn-db-fail")).rejects.toThrow("DB failure");
        });
    });

    describe("getSocket", () => {
        it("returns the socket if present", async () => {
            const socket = { id: "ws-socket" };
            await manager.add(createAddParams("conn-4", socket));

            expect(manager.getSocket("conn-4")).toBe(socket);
        });

        it("returns undefined for unknown connectionId", () => {
            expect(manager.getSocket("unknown")).toBeUndefined();
        });
    });

    describe("getMetadata", () => {
        it("returns metadata if present", async () => {
            const params = createAddParams("conn-5");
            await manager.add(params);

            const meta = manager.getMetadata("conn-5");
            expect(meta).toBeDefined();
            expect(meta?.connectionId).toBe("conn-5");
        });

        it("returns undefined for unknown connectionId", () => {
            expect(manager.getMetadata("unknown")).toBeUndefined();
        });
    });

    describe("updateLastSeen", () => {
        it("delegates to registry.updateLastSeen()", async () => {
            await manager.updateLastSeen("conn-6");

            expect(registry.updateLastSeen).toHaveBeenCalledWith("conn-6");
        });

        /*
         * Each write runs in a fresh request container, so a chatty client must not cost one per
         * message: a connection's `lastSeen` is written at most once per interval.
         */
        it("writes a live connection's lastSeen at most once per interval", async () => {
            const now = Date.now();
            const clock = vi.spyOn(Date, "now").mockReturnValue(now);
            await manager.add(createAddParams("conn-chatty"));

            // Registering wrote `lastSeen`: the messages right after it write nothing.
            await manager.updateLastSeen("conn-chatty");
            clock.mockReturnValue(now + LAST_SEEN_WRITE_INTERVAL - 1);
            await manager.updateLastSeen("conn-chatty");
            expect(registry.updateLastSeen).not.toHaveBeenCalled();

            clock.mockReturnValue(now + LAST_SEEN_WRITE_INTERVAL);
            await manager.updateLastSeen("conn-chatty");
            await manager.updateLastSeen("conn-chatty");
            expect(registry.updateLastSeen).toHaveBeenCalledTimes(1);

            clock.mockRestore();
        });

        it("writes again on the next message when a write fails", async () => {
            const now = Date.now();
            const clock = vi.spyOn(Date, "now").mockReturnValue(now);
            await manager.add(createAddParams("conn-retry"));
            clock.mockReturnValue(now + LAST_SEEN_WRITE_INTERVAL);
            vi.mocked(registry.updateLastSeen).mockRejectedValueOnce(new Error("DB down"));

            await expect(manager.updateLastSeen("conn-retry")).rejects.toThrow("DB down");
            await manager.updateLastSeen("conn-retry");

            expect(registry.updateLastSeen).toHaveBeenCalledTimes(2);
            clock.mockRestore();
        });

        it("writes within a quarter of a shorter stale cutoff", async () => {
            const now = Date.now();
            const clock = vi.spyOn(Date, "now").mockReturnValue(now);
            await manager.add(createAddParams("conn-short"));
            await manager.cleanup(8_000);

            clock.mockReturnValue(now + 2_000);
            await manager.updateLastSeen("conn-short");

            expect(registry.updateLastSeen).toHaveBeenCalledWith("conn-short");
            clock.mockRestore();
        });
    });

    describe("cleanup", () => {
        it("queries registry.listStale() with the correct date, removes each stale connection, and returns connectionIds", async () => {
            const now = Date.now();
            vi.spyOn(Date, "now").mockReturnValue(now);

            const staleEntries = [
                {
                    connectionId: "stale-1",
                    identity: { id: "u1", displayName: "U1", type: "admin" },
                    tenant: "root",
                    connectedOn: new Date().toISOString(),
                    endpoint: "ws://localhost/ws"
                },
                {
                    connectionId: "stale-2",
                    identity: { id: "u2", displayName: "U2", type: "admin" },
                    tenant: "root",
                    connectedOn: new Date().toISOString(),
                    endpoint: "ws://localhost/ws"
                }
            ];
            vi.mocked(registry.listStale).mockResolvedValueOnce(staleEntries);

            const maxAge = 60_000;
            const result = await manager.cleanup(maxAge);

            const expectedOlderThan = new Date(now - maxAge);
            expect(registry.listStale).toHaveBeenCalledWith(expectedOlderThan);
            expect(registry.unregister).toHaveBeenCalledWith({ connectionId: "stale-1" });
            expect(registry.unregister).toHaveBeenCalledWith({ connectionId: "stale-2" });
            expect(result).toEqual(["stale-1", "stale-2"]);

            vi.restoreAllMocks();
        });

        it("removes all the stale rows in one event, and forgets their sockets", async () => {
            const dispatcher = { dispatch: vi.fn().mockResolvedValue(["stale-a", "stale-b"]) };
            const rootManager = new ServerConnectionManagerImpl(
                new InMemoryLiveSocketsImpl(),
                dispatcher,
                owner
            );
            await rootManager.add(createAddParams("stale-a"));
            await rootManager.add(createAddParams("stale-b"));
            dispatcher.dispatch.mockClear();

            const result = await rootManager.cleanup(900_000);

            expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
            expect(dispatcher.dispatch.mock.calls[0][0].action).toBe("removeStale");
            expect(result).toEqual(["stale-a", "stale-b"]);
            expect(rootManager.getActiveConnectionIds()).toEqual([]);
        });
    });
});
