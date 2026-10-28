import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServerWebsocketsTransportImpl } from "~/transport/ServerWebsocketsTransport.js";
import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";
import type { WebsocketsServerAdapter } from "~/adapter/abstractions.js";
import type { WebsocketsMessageBus } from "~/bus/abstractions.js";

const owner = { id: "host-a:1:aaaa" };
const otherOwner = "host-b:1:bbbb";

const createMockConnectionManager = (): WebsocketsConnectionManager.Interface<unknown> => ({
    add: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    groupByOwner: vi.fn().mockResolvedValue(new Map()),
    getSocket: vi.fn().mockReturnValue(undefined),
    getMetadata: vi.fn().mockReturnValue(undefined),
    updateLastSeen: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue([]),
    getActiveConnectionIds: vi.fn().mockReturnValue([])
});

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
    let connectionManager: WebsocketsConnectionManager.Interface<unknown>;
    let adapter: WebsocketsServerAdapter.Interface<unknown>;
    let bus: WebsocketsMessageBus.Interface;
    let logger: ReturnType<typeof createMockLogger>;
    let transport: ServerWebsocketsTransportImpl;

    beforeEach(() => {
        connectionManager = createMockConnectionManager();
        adapter = createMockAdapter();
        bus = createMockBus();
        logger = createMockLogger();
        transport = new ServerWebsocketsTransportImpl(
            connectionManager,
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
            vi.mocked(connectionManager.getSocket).mockReturnValue(socket);
            const connection = createConnection("conn-1");

            await transport.send([connection], data);

            expect(adapter.send).toHaveBeenCalledWith(socket, JSON.stringify(data));
            expect(bus.publish).not.toHaveBeenCalled();
        });

        it("publishes to the process that holds the socket", async () => {
            const byOwner = new Map([[otherOwner, ["conn-b"]]]);
            vi.mocked(connectionManager.groupByOwner).mockResolvedValue(byOwner);
            const connection = createConnection("conn-b");

            await transport.send([connection], data);

            expect(connectionManager.groupByOwner).toHaveBeenCalledWith(["conn-b"]);
            expect(bus.publish).toHaveBeenCalledWith(otherOwner, {
                action: "send",
                connectionIds: ["conn-b"],
                data
            });
            expect(connectionManager.remove).not.toHaveBeenCalled();
        });

        // This process owns it and has no socket for it, so the socket is gone.
        it("removes its own connection that has no socket left", async () => {
            const byOwner = new Map([[owner.id, ["conn-gone"]]]);
            vi.mocked(connectionManager.groupByOwner).mockResolvedValue(byOwner);
            const connection = createConnection("conn-gone");

            await transport.send([connection], data);

            expect(connectionManager.remove).toHaveBeenCalledWith("conn-gone");
            expect(bus.publish).not.toHaveBeenCalled();
        });

        it("logs a failed publish and does not throw", async () => {
            const byOwner = new Map([[otherOwner, ["conn-b"]]]);
            vi.mocked(connectionManager.groupByOwner).mockResolvedValue(byOwner);
            vi.mocked(bus.publish).mockRejectedValue(new Error("Redis is not connected."));
            const connection = createConnection("conn-b");

            await transport.send([connection], data);

            expect(logger.error).toHaveBeenCalledTimes(1);
        });

        it("logs a failed socket send and goes on to the next connection", async () => {
            vi.mocked(connectionManager.getSocket).mockReturnValue({});
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
            vi.mocked(connectionManager.getSocket).mockReturnValue(socket);
            const connection = createConnection("conn-1");

            await transport.disconnect([connection]);

            expect(adapter.close).toHaveBeenCalledWith(socket);
            expect(connectionManager.remove).toHaveBeenCalledWith("conn-1");
        });

        it("publishes the disconnect to the process that holds the socket", async () => {
            const byOwner = new Map([[otherOwner, ["conn-b"]]]);
            vi.mocked(connectionManager.groupByOwner).mockResolvedValue(byOwner);
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
