import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServerWebsocketsTransportImpl } from "~/transport/ServerWebsocketsTransport.js";
import type { WebsocketsConnectionManager, WebsocketsServerAdapter } from "~/abstractions.js";

const createMockConnectionManager = (): WebsocketsConnectionManager.Interface<unknown> => ({
    add: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    getSocket: vi.fn().mockReturnValue(undefined),
    getMetadata: vi.fn().mockReturnValue(undefined),
    updateLastSeen: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue([])
});

const createMockAdapter = (): WebsocketsServerAdapter.Interface<unknown> => ({
    start: vi.fn(),
    stop: vi.fn().mockResolvedValue(undefined),
    onConnection: vi.fn(),
    onMessage: vi.fn(),
    onClose: vi.fn(),
    onError: vi.fn(),
    send: vi.fn().mockResolvedValue(undefined),
    close: vi.fn()
});

const createConnection = (connectionId: string) => ({
    connectionId,
    endpoint: "ws://localhost/ws"
});

describe("ServerWebsocketsTransport", () => {
    let connectionManager: WebsocketsConnectionManager.Interface<unknown>;
    let adapter: WebsocketsServerAdapter.Interface<unknown>;
    let transport: ServerWebsocketsTransportImpl;

    beforeEach(() => {
        connectionManager = createMockConnectionManager();
        adapter = createMockAdapter();
        transport = new ServerWebsocketsTransportImpl(connectionManager, adapter);
    });

    describe("send", () => {
        it("calls adapter.send() with serialized data when socket is found", async () => {
            const socket = { id: "socket-1" };
            vi.mocked(connectionManager.getSocket).mockReturnValue(socket);

            const connection = createConnection("conn-1");
            const data = { action: "message", data: { text: "hello" } };

            await transport.send([connection], data);

            expect(adapter.send).toHaveBeenCalledWith(socket, JSON.stringify(data));
        });

        it("calls connectionManager.remove() when socket is not found and does NOT call adapter.send()", async () => {
            vi.mocked(connectionManager.getSocket).mockReturnValue(undefined);

            const connection = createConnection("conn-missing");

            await transport.send([connection], { action: "message" });

            expect(connectionManager.remove).toHaveBeenCalledWith("conn-missing");
            expect(adapter.send).not.toHaveBeenCalled();
        });

        it("logs error and continues to next connection when adapter.send() throws", async () => {
            const socket1 = { id: "socket-1" };
            const socket2 = { id: "socket-2" };
            vi.mocked(connectionManager.getSocket)
                .mockReturnValueOnce(socket1)
                .mockReturnValueOnce(socket2);

            const sendError = new Error("Network failure");
            vi.mocked(adapter.send)
                .mockRejectedValueOnce(sendError)
                .mockResolvedValueOnce(undefined);

            const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
            const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

            const connections = [createConnection("conn-1"), createConnection("conn-2")];
            const data = { action: "ping" };

            await transport.send(connections, data);

            expect(consoleError).toHaveBeenCalledWith(
                `Failed to send message to connection "conn-1". Check logs for more information.`
            );
            expect(consoleLog).toHaveBeenCalledWith(sendError);
            /* Second connection should still be processed. */
            expect(adapter.send).toHaveBeenCalledTimes(2);
            expect(adapter.send).toHaveBeenNthCalledWith(2, socket2, JSON.stringify(data));

            consoleError.mockRestore();
            consoleLog.mockRestore();
        });
    });

    describe("disconnect", () => {
        it("calls adapter.close() and connectionManager.remove() when socket is found", async () => {
            const socket = { id: "socket-1" };
            vi.mocked(connectionManager.getSocket).mockReturnValue(socket);

            const connection = createConnection("conn-1");

            await transport.disconnect([connection]);

            expect(adapter.close).toHaveBeenCalledWith(socket);
            expect(connectionManager.remove).toHaveBeenCalledWith("conn-1");
        });

        it("calls connectionManager.remove() when socket is not found and does NOT call adapter.close()", async () => {
            vi.mocked(connectionManager.getSocket).mockReturnValue(undefined);

            const connection = createConnection("conn-missing");

            await transport.disconnect([connection]);

            expect(connectionManager.remove).toHaveBeenCalledWith("conn-missing");
            expect(adapter.close).not.toHaveBeenCalled();
        });
    });
});
