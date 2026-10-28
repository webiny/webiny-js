import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import type { IWebsocketsConnectionRegistry } from "@webiny/api-websockets";
import type { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { ServerConnectionManagerImpl } from "~/connectionManager/ServerConnectionManager.js";
import { ServerWebsocketsTransportImpl } from "~/transport/ServerWebsocketsTransport.js";
import { InProcessMessageBusImpl } from "~/bus/InProcessMessageBus.js";
import { createBusMessageHandler } from "~/bus/createBusMessageHandler.js";
import type { WebsocketsServerAdapter } from "~/adapter/abstractions.js";

/*
 * One registry, as one database would be, kept in memory and shared by the "processes" of a test.
 */
const createRegistry = (): IWebsocketsConnectionRegistry => {
    const rows = new Map<string, ConnectionRegistry.Data>();
    return {
        async register(params) {
            const row: ConnectionRegistry.Data = { ...params };
            rows.set(params.connectionId, row);
            return row;
        },
        async unregister(params) {
            rows.delete(params.connectionId);
        },
        async listViaConnections(connectionIds) {
            const found = connectionIds.map(connectionId => rows.get(connectionId));
            return found.filter((row): row is ConnectionRegistry.Data => row !== undefined);
        },
        async listViaIdentity() {
            return [];
        },
        async listViaTenant() {
            return [];
        },
        async listAll() {
            return Array.from(rows.values());
        },
        async updateLastSeen() {
            return;
        },
        async listStale() {
            return [];
        }
    };
};

const createAdapter = (): WebsocketsServerAdapter.Interface<unknown> => ({
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

const logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    log: vi.fn()
};

/*
 * One API process: its own owner id, sockets and adapter, the shared registry and bus, and the bus
 * subscription every process makes at boot.
 */
const createProcess = async (
    ownerId: string,
    registry: IWebsocketsConnectionRegistry,
    bus: InProcessMessageBusImpl
) => {
    const owner = { id: ownerId };
    const connectionManager = new ServerConnectionManagerImpl(registry, owner);
    const adapter = createAdapter();
    const transport = new ServerWebsocketsTransportImpl(
        connectionManager,
        adapter,
        bus,
        owner,
        logger
    );
    const handleBusMessage = createBusMessageHandler({ connectionManager, adapter, logger });
    await bus.subscribe(ownerId, handleBusMessage);

    const connect = async (connectionId: string) => {
        const socket = { connectionId };
        await connectionManager.add({
            connectionId,
            socket,
            endpoint: "ws://localhost",
            identity: { id: "user-1", displayName: "User One", type: "admin" },
            tenant: "root",
            connectedAt: Date.now(),
            host: "localhost",
            headers: {}
        });
        return socket;
    };

    return { transport, adapter, connectionManager, connect };
};

describe("websocket messages across processes", () => {
    let registry: IWebsocketsConnectionRegistry;
    let bus: InProcessMessageBusImpl;

    beforeEach(() => {
        registry = createRegistry();
        bus = new InProcessMessageBusImpl();
    });

    it("delivers a send from A to the socket B holds", async () => {
        const a = await createProcess("A", registry, bus);
        const b = await createProcess("B", registry, bus);
        const socket = await b.connect("abc");
        const data = { action: "message", data: { text: "export ready" } };

        await a.transport.send([{ connectionId: "abc", endpoint: "" }], data);

        expect(b.adapter.send).toHaveBeenCalledWith(socket, JSON.stringify(data));
        expect(a.adapter.send).not.toHaveBeenCalled();
        const rows = await registry.listAll();
        expect(rows).toHaveLength(1);
    });

    it("delivers a disconnect from A to B, which closes the socket and removes the row", async () => {
        const a = await createProcess("A", registry, bus);
        const b = await createProcess("B", registry, bus);
        const socket = await b.connect("abc");

        await a.transport.disconnect([{ connectionId: "abc", endpoint: "" }]);

        expect(b.adapter.close).toHaveBeenCalledWith(socket);
        const rows = await registry.listAll();
        expect(rows).toHaveLength(0);
    });

    // B owns the row but its socket is gone: only B can tell, so B removes it.
    it("lets B remove its row when B's socket is gone", async () => {
        const a = await createProcess("A", registry, bus);
        await createProcess("B", registry, bus);
        await registry.register({
            connectionId: "gone",
            identity: { id: "user-1", displayName: "User One", type: "admin" },
            tenant: "root",
            endpoint: "ws://localhost",
            connectedOn: new Date().toISOString(),
            owner: "B"
        });

        await a.transport.send([{ connectionId: "gone", endpoint: "" }], { action: "message" });

        const rows = await registry.listAll();
        expect(rows).toHaveLength(0);
    });

    // The owner is a process that is no longer running; nobody listens on its channel.
    it("drops a send for a process that is not listening and keeps its row", async () => {
        const a = await createProcess("A", registry, bus);
        await registry.register({
            connectionId: "orphan",
            identity: { id: "user-1", displayName: "User One", type: "admin" },
            tenant: "root",
            endpoint: "ws://localhost",
            connectedOn: new Date().toISOString(),
            owner: "C"
        });

        await a.transport.send([{ connectionId: "orphan", endpoint: "" }], { action: "message" });

        const rows = await registry.listAll();
        expect(rows).toHaveLength(1);
    });
});
