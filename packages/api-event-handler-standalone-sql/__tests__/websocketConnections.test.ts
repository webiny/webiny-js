import { afterEach, describe, expect, it, vi } from "vitest";
import type { Knex } from "knex";
import { WebSocket } from "ws";
import { createServer } from "./createServer.js";
import { createPgServer } from "./createPgServer.js";

/**
 * The server holds its live sockets in the root, in memory; the connections' rows are a storage, in
 * request containers. Each change to a row (a socket that connects or closes, the heartbeat's sweep
 * of stale connections) runs in a request container the server dispatches, on that request's
 * registry. These run the real server, on both SQL storages.
 */

const TABLE = "WebsocketsConnections";

/* The heartbeat's interval: each tick sweeps the connections not seen for 15 minutes. */
const HEARTBEAT_MS = 60_000;

interface Row {
    connectionId: string;
    owner: string | null;
}

/*
 * The test keeps the timers faked (so it fires the heartbeat when it wants), so it can't sleep: it
 * yields to I/O with setImmediate, and gives up after 10 real seconds.
 */
const waitFor = async (label: string, check: () => Promise<boolean>): Promise<void> => {
    const giveUpAt = Date.now() + 10_000;
    while (Date.now() < giveUpAt) {
        if (await check()) {
            return;
        }
        await new Promise(resolve => setImmediate(resolve));
    }
    throw new Error(`Timed out waiting for ${label}.`);
};

const connect = (port: number): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(`ws://127.0.0.1:${port}/?tenant=root`);
        socket.once("open", () => resolve(socket));
        socket.once("error", reject);
    });
};

const readRows = (knex: Knex): Promise<Row[]> => {
    return knex<Row>(TABLE).select("connectionId", "owner");
};

/** A row another process left behind an hour ago: the heartbeat must sweep it. */
const insertStaleRow = async (knex: Knex): Promise<void> => {
    const anHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    await knex(TABLE).insert({
        connectionId: "stale-connection",
        identityId: "someone",
        identityDisplayName: "Someone",
        identityType: "admin",
        tenant: "root",
        endpoint: "ws://127.0.0.1",
        connectedOn: anHourAgo,
        lastSeen: anHourAgo,
        owner: "gone-process"
    });
};

const runConnectionLifecycle = async (server: { port: number; knex: Knex }) => {
    const { knex } = server;

    // Connect: the row is written, owned by this process.
    const socket = await connect(server.port);
    await waitFor("the connection's row", async () => (await readRows(knex)).length === 1);
    const [live] = await readRows(knex);
    expect(live.owner).toBeTruthy();

    // A heartbeat tick sweeps the stale row and leaves the live one.
    await insertStaleRow(knex);
    await vi.advanceTimersByTimeAsync(HEARTBEAT_MS);
    await waitFor("the stale row to be swept", async () => {
        const ids = (await readRows(knex)).map(row => row.connectionId);
        return !ids.includes("stale-connection");
    });
    expect((await readRows(knex)).map(row => row.connectionId)).toEqual([live.connectionId]);

    // Disconnect: the row is removed.
    socket.close();
    await waitFor("the row to be removed", async () => (await readRows(knex)).length === 0);
};

describe("api-event-handler-standalone-sql — websocket connections", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("on SQLite, writes a connection's row, sweeps stale rows and removes it on close", async () => {
        const server = await createServer(() => [], {}, { keepFakeTimers: true });
        try {
            await server.knex(TABLE).delete();
            await runConnectionLifecycle(server);
        } finally {
            await server.close();
        }
    });

    it("on PGlite, writes a connection's row, sweeps stale rows and removes it on close", async () => {
        const server = await createPgServer({ keepFakeTimers: true });
        try {
            await runConnectionLifecycle(server);
        } finally {
            await server.close();
        }
    });
});
