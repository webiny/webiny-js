import { describe, it, expect, vi } from "vitest";
import { HeartbeatManager } from "~/heartbeat/HeartbeatManager.js";
import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";
import type { WebsocketsServerAdapter } from "~/adapter/abstractions.js";

const createManager = (
    sockets: Record<string, unknown>,
    cleanup: WebsocketsConnectionManager.Interface<unknown>["cleanup"]
): WebsocketsConnectionManager.Interface<unknown> => {
    const live = new Map(Object.entries(sockets));
    return {
        add: vi.fn(),
        remove: vi.fn(),
        getSocket: id => live.get(id),
        getMetadata: vi.fn(),
        updateLastSeen: vi.fn(),
        cleanup: async maxAge => {
            const evicted = await cleanup(maxAge);
            for (const id of evicted) {
                live.delete(id);
            }
            return evicted;
        },
        getActiveConnectionIds: () => Array.from(live.keys())
    };
};

const createAdapter = (): WebsocketsServerAdapter.Interface<unknown> => ({
    start: vi.fn(),
    stop: vi.fn(),
    onConnection: vi.fn(),
    onMessage: vi.fn(),
    onClose: vi.fn(),
    onError: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    handleUpgrade: vi.fn()
});

describe("HeartbeatManager", () => {
    it("closes the sockets of the connections it evicts", async () => {
        const staleSocket = { name: "stale" };
        const freshSocket = { name: "fresh" };
        const cleanup = vi.fn().mockResolvedValue(["stale"]);
        const manager = createManager({ stale: staleSocket, fresh: freshSocket }, cleanup);
        const adapter = createAdapter();

        const heartbeat = new HeartbeatManager(manager, adapter, 60_000, 900_000);
        await heartbeat.evictStale();

        expect(cleanup).toHaveBeenCalledWith(900_000);
        expect(adapter.close).toHaveBeenCalledTimes(1);
        expect(adapter.close).toHaveBeenCalledWith(staleSocket, 1001, "Connection went stale.");
    });

    it("skips evicted connections that have no live socket", async () => {
        const cleanup = vi.fn().mockResolvedValue(["from-previous-process"]);
        const manager = createManager({}, cleanup);
        const adapter = createAdapter();

        const heartbeat = new HeartbeatManager(manager, adapter, 60_000, 900_000);
        await heartbeat.evictStale();

        expect(adapter.close).not.toHaveBeenCalled();
    });

    it("survives a failing cleanup", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const cleanup = vi.fn().mockRejectedValue(new Error("SQLITE_BUSY"));
        const manager = createManager({ live: {} }, cleanup);
        const adapter = createAdapter();

        const heartbeat = new HeartbeatManager(manager, adapter, 60_000, 900_000);

        await expect(heartbeat.evictStale()).resolves.toBeUndefined();
        expect(adapter.close).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
