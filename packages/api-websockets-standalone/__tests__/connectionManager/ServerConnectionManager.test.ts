import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    LAST_SEEN_WRITE_INTERVAL,
    ServerConnectionManagerImpl
} from "~/connectionManager/ServerConnectionManager.js";
import { InMemoryLiveSockets } from "~/liveSockets/InMemoryLiveSockets.js";
import { WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER } from "~/rows/abstractions.js";
import type { IWebsocketsConnectionRegistry } from "@webiny/api-websockets";
import {
    createConnectionManager,
    createMockLogger
} from "~tests/helpers/createConnectionManager.js";
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
    let logger: ReturnType<typeof createMockLogger>;

    beforeEach(() => {
        registry = createMockRegistry();
        logger = createMockLogger();
        // The rows change through events, whose handler runs on a request's registry: `registry`.
        manager = createConnectionManager(registry, owner, new InMemoryLiveSockets(), logger);
    });

    describe("rows", () => {
        /*
         * The manager is a root singleton, and the registry is a storage, which lives in request
         * containers: it holds no registry, and every row change is an event a fresh request runs.
         */
        it("changes the rows only by dispatching events", async () => {
            const dispatcher = { dispatch: vi.fn().mockResolvedValue(null) };
            const rootManager = new ServerConnectionManagerImpl(
                new InMemoryLiveSockets(),
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
                return event.action === "write"
                    ? event.writes.map((write: { action: string }) => write.action)
                    : event.action;
            });
            expect(actions).toEqual([
                ["register"],
                ["updateLastSeen"],
                ["unregister"],
                "removeStale"
            ]);
            expect(rootManager.getSocket("conn-events")).toBeUndefined();
            clock.mockRestore();
        });

        /*
         * Every event builds a request container: a burst of connects and disconnects (clients
         * reconnecting after a restart) is batched, one event in flight at a time.
         */
        it("batches the row writes queued while an event is in flight", async () => {
            const sent: string[][] = [];
            let release: () => void = () => {};
            const dispatcher = {
                dispatch: vi.fn(async (event: { writes: { action: string }[] }) => {
                    sent.push(event.writes.map(write => write.action));
                    if (sent.length === 1) {
                        await new Promise<void>(resolve => {
                            release = resolve;
                        });
                    }
                    return event.writes.map(() => null);
                })
            };
            const rootManager = new ServerConnectionManagerImpl(
                new InMemoryLiveSockets(),
                dispatcher,
                owner
            );

            const first = rootManager.add(createAddParams("burst-0"));
            await vi.waitFor(() => expect(sent).toHaveLength(1));
            const rest = Promise.all([
                rootManager.add(createAddParams("burst-1")),
                rootManager.add(createAddParams("burst-2")),
                rootManager.remove("burst-0")
            ]);
            release();
            await Promise.all([first, rest]);

            expect(sent).toEqual([["register"], ["register", "register", "unregister"]]);
        });

        it("fails only the writes that failed in a batch", async () => {
            vi.mocked(registry.register).mockImplementation(async params => {
                if (params.connectionId === "batch-bad") {
                    throw Object.assign(new Error("Duplicate"), { code: "DUPLICATE" });
                }
                return {} as never;
            });

            const [good, bad] = await Promise.allSettled([
                manager.add(createAddParams("batch-good")),
                manager.add(createAddParams("batch-bad"))
            ]);

            expect(registry.register).toHaveBeenCalledTimes(2);
            expect(good.status).toBe("fulfilled");
            expect(bad).toMatchObject({
                status: "rejected",
                reason: { message: "Duplicate", code: "DUPLICATE" }
            });
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

        it("returns the rows it removed when a later one fails, and keeps the failed one's socket", async () => {
            const stale = (connectionId: string) => ({
                connectionId,
                identity: { id: "u1", displayName: "U1", type: "admin" },
                tenant: "root",
                connectedOn: new Date().toISOString(),
                endpoint: "ws://localhost/ws"
            });
            await manager.add(createAddParams("stale-1"));
            await manager.add(createAddParams("stale-2"));
            await manager.add(createAddParams("stale-3"));
            vi.mocked(registry.listStale).mockResolvedValueOnce([
                stale("stale-1"),
                stale("stale-2"),
                stale("stale-3")
            ]);
            vi.mocked(registry.unregister).mockImplementation(async ({ connectionId }) => {
                if (connectionId === "stale-2") {
                    throw new Error("connection lost");
                }
            });
            const result = await manager.cleanup(60_000);

            // stale-1 was deleted before the failure: its socket must still be closed.
            expect(result).toEqual(["stale-1", "stale-3"]);
            // stale-2's row is still there, so its socket stays for the next sweep.
            expect(manager.getActiveConnectionIds()).toEqual(["stale-2"]);
            expect(logger.error).toHaveBeenCalledTimes(1);
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({ connectionId: "stale-2" }),
                expect.any(String)
            );
        });

        it("removes all the stale rows in one event, and forgets their sockets", async () => {
            const dispatcher = {
                dispatch: vi.fn(async (event: { action: string; writes?: unknown[] }) => {
                    return event.action === "removeStale"
                        ? ["stale-a", "stale-b"]
                        : event.writes?.map(() => null);
                })
            };
            const rootManager = new ServerConnectionManagerImpl(
                new InMemoryLiveSockets(),
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
