import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServerWebsocketsTransportImpl } from "~/transport/ServerWebsocketsTransport.js";
import type { IWebsocketsConnectionRegistry } from "@webiny/api-websockets";
import type { WebsocketsLiveSockets } from "~/liveSockets/abstractions.js";
import type { WebsocketsServerAdapter } from "~/adapter/abstractions.js";
import type { WebsocketsMessageBus } from "~/bus/abstractions.js";

const owner = { id: "host-a:1:aaaa" };
const otherOwner = "host-b:1:bbbb";

const createMockSockets = (): WebsocketsLiveSockets.Interface => ({
    add: vi.fn(),
    remove: vi.fn().mockReturnValue(true),
    getSocket: vi.fn().mockReturnValue(undefined),
    getMetadata: vi.fn().mockReturnValue(undefined),
    getActiveConnectionIds: vi.fn().mockReturnValue([])
});

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

/* The registry's rows of these connections, held by the given processes. */
const rows = (owners: Record<string, string | undefined>) => {
    return Object.entries(owners).map(([connectionId, rowOwner]) => ({
        connectionId,
        identity: { id: "u1", displayName: "U1", type: "admin" },
        tenant: "root",
        connectedOn: new Date().toISOString(),
        endpoint: "ws://localhost/ws",
        owner: rowOwner
    }));
};

const createMockAdapter = (): WebsocketsServerAdapter.Interface<unknown> => ({
    start: vi.fn(),
    stop: vi.fn().mockResolvedValue(undefined),
    handleUpgrade: vi.fn(),
    onConnection: vi.fn(),
    onMessage: vi.fn(),
    onClose: vi.fn(),
    onError: vi.fn(),
    send: vi.fn().mockResolvedValue(undefined),
    close: vi.fn()
});

const createMockBus = (): WebsocketsMessageBus.Interface => ({
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined)
});

const createMockLogger = () => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    log: vi.fn()
});

const createConnection = (connectionId: string) => ({
    connectionId,
    endpoint: "ws://localhost/ws"
});

describe("ServerWebsocketsTransport", () => {
    let sockets: WebsocketsLiveSockets.Interface;
    let registry: IWebsocketsConnectionRegistry;
    let adapter: WebsocketsServerAdapter.Interface<unknown>;
    let bus: WebsocketsMessageBus.Interface;
    let logger: ReturnType<typeof createMockLogger>;
    let transport: ServerWebsocketsTransportImpl;

    beforeEach(() => {
        sockets = createMockSockets();
        registry = createMockRegistry();
        adapter = createMockAdapter();
        bus = createMockBus();
        logger = createMockLogger();
        transport = new ServerWebsocketsTransportImpl(
            sockets,
            registry,
            adapter,
            bus,
            owner,
            logger
        );
    });

    describe("send", () => {
        const data = { action: "message", data: { text: "export ready" } };

        it("sends on a socket this process holds", async () => {
            const socket = { id: "socket-1" };
            vi.mocked(sockets.getSocket).mockReturnValue(socket);
            const connection = createConnection("conn-1");

            await transport.send([connection], data);

            expect(adapter.send).toHaveBeenCalledWith(socket, JSON.stringify(data));
            expect(bus.publish).not.toHaveBeenCalled();
        });

        it("publishes to the process that holds the socket", async () => {
            vi.mocked(registry.listViaConnections).mockResolvedValue(
                rows({ "conn-b": otherOwner })
            );
            const connection = createConnection("conn-b");

            await transport.send([connection], data);

            expect(registry.listViaConnections).toHaveBeenCalledWith(["conn-b"]);
            expect(bus.publish).toHaveBeenCalledWith(otherOwner, {
                action: "send",
                connectionIds: ["conn-b"],
                data
            });
            expect(registry.unregister).not.toHaveBeenCalled();
        });

        // This process owns it and has no socket for it, so the socket is gone.
        it("removes its own connection that has no socket left", async () => {
            vi.mocked(registry.listViaConnections).mockResolvedValue(
                rows({ "conn-gone": owner.id })
            );
            const connection = createConnection("conn-gone");

            await transport.send([connection], data);

            expect(sockets.remove).toHaveBeenCalledWith("conn-gone");
            expect(registry.unregister).toHaveBeenCalledWith({ connectionId: "conn-gone" });
            expect(bus.publish).not.toHaveBeenCalled();
        });

        it("logs a failed publish and does not throw", async () => {
            vi.mocked(registry.listViaConnections).mockResolvedValue(
                rows({ "conn-b": otherOwner })
            );
            vi.mocked(bus.publish).mockRejectedValue(new Error("Redis is not connected."));
            const connection = createConnection("conn-b");

            await transport.send([connection], data);

            expect(logger.error).toHaveBeenCalledTimes(1);
        });

        it("leaves a row without an owner for the stale cleanup", async () => {
            vi.mocked(registry.listViaConnections).mockResolvedValue(rows({ old: undefined }));

            await transport.send([createConnection("old")], data);

            expect(bus.publish).not.toHaveBeenCalled();
            expect(registry.unregister).not.toHaveBeenCalled();
        });

        it("does not query the registry when every socket is here", async () => {
            vi.mocked(sockets.getSocket).mockReturnValue({});

            await transport.send([createConnection("conn-1")], data);

            expect(registry.listViaConnections).not.toHaveBeenCalled();
        });

        it("logs a failed socket send and goes on to the next connection", async () => {
            vi.mocked(sockets.getSocket).mockReturnValue({});
            vi.mocked(adapter.send)
                .mockRejectedValueOnce(new Error("socket closed"))
                .mockResolvedValueOnce(undefined);
            const first = createConnection("conn-1");
            const second = createConnection("conn-2");

            await transport.send([first, second], data);

            expect(adapter.send).toHaveBeenCalledTimes(2);
            expect(logger.error).toHaveBeenCalledTimes(1);
        });
    });

    describe("disconnect", () => {
        it("closes a socket this process holds and removes its connection", async () => {
            const socket = { id: "socket-1" };
            vi.mocked(sockets.getSocket).mockReturnValue(socket);
            const connection = createConnection("conn-1");

            await transport.disconnect([connection]);

            expect(adapter.close).toHaveBeenCalledWith(socket);
            expect(sockets.remove).toHaveBeenCalledWith("conn-1");
            expect(registry.unregister).toHaveBeenCalledWith({ connectionId: "conn-1" });
        });

        it("publishes the disconnect to the process that holds the socket", async () => {
            vi.mocked(registry.listViaConnections).mockResolvedValue(
                rows({ "conn-b": otherOwner })
            );
            const connection = createConnection("conn-b");

            await transport.disconnect([connection]);

            expect(bus.publish).toHaveBeenCalledWith(otherOwner, {
                action: "disconnect",
                connectionIds: ["conn-b"]
            });
            expect(adapter.close).not.toHaveBeenCalled();
        });
    });
});
