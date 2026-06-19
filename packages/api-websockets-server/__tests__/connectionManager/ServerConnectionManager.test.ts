import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServerConnectionManagerImpl } from "~/connectionManager/ServerConnectionManager.js";
import type { IWebsocketsConnectionRegistry } from "@webiny/api-websockets";
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
        manager = new ServerConnectionManagerImpl(registry);
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

        it("does NOT call registry.register()", async () => {
            const params = createAddParams("conn-2");

            await manager.add(params);

            expect(registry.register).not.toHaveBeenCalled();
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
    });
});
