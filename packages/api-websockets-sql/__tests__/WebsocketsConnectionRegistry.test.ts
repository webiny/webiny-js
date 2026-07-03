import { describe, it, expect, beforeEach, afterEach } from "vitest";
import knexLib from "knex";
import type { Knex } from "knex";
import { Container } from "@webiny/di";
import { KnexClient } from "@webiny/api-core-sql";
import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { TableName } from "../src/TableName/abstractions.js";
import { TableName as TableNameImpl } from "../src/TableName/TableName.js";
import { WebsocketsConnectionRegistry } from "../src/WebsocketsConnectionRegistry.js";

const makeRegisterParams = (connectionId: string): ConnectionRegistry.RegisterParams => ({
    connectionId,
    tenant: "root",
    identity: {
        id: "user1",
        displayName: "User One",
        type: "admin"
    },
    endpoint: "https://example.execute-api.us-east-1.amazonaws.com/dev",
    connectedOn: new Date("2024-01-01T00:00:00.000Z").toISOString()
});

const createKnex = (): Knex => {
    return knexLib({
        client: "better-sqlite3",
        connection: {
            filename: ":memory:"
        },
        useNullAsDefault: true
    });
};

const createRegistry = (knex: Knex, prefix?: string): ConnectionRegistry.Interface => {
    const container = new Container();
    container.registerInstance(KnexClient, { client: knex });
    container.registerInstance(TableName, new TableNameImpl(prefix));
    container.register(WebsocketsConnectionRegistry);

    return container.resolve(ConnectionRegistry);
};

describe("WebsocketsConnectionRegistry (SQL)", () => {
    let knex: Knex;
    let registry: ConnectionRegistry.Interface;

    beforeEach(() => {
        knex = createKnex();
        registry = createRegistry(knex);
    });

    afterEach(async () => {
        await knex.destroy();
    });

    describe("updateLastSeen", () => {
        it("should update lastSeen to the current datetime for an existing connection", async () => {
            await registry.register(makeRegisterParams("conn-1"));

            const before = new Date();
            await registry.updateLastSeen("conn-1");
            const after = new Date();

            /* Verify the row was updated by listing stale connections with a threshold in the past. */
            const staleBeforeUpdate = await registry.listStale(before);
            expect(staleBeforeUpdate.length).toBe(0);

            /* A very old threshold should now find nothing stale. */
            const staleAfterUpdate = await registry.listStale(new Date(after.getTime() + 60_000));
            expect(staleAfterUpdate.length).toBe(1);
            expect(staleAfterUpdate[0].connectionId).toBe("conn-1");
        });

        it("should not throw for a non-existent connectionId", async () => {
            await expect(registry.updateLastSeen("does-not-exist")).resolves.toBeUndefined();
        });

        it("should update lastSeen on a connection that already has a lastSeen value", async () => {
            await registry.register(makeRegisterParams("conn-2"));
            await registry.updateLastSeen("conn-2");

            const firstTime = new Date();

            /* Wait a tiny bit so the second update has a strictly later timestamp. */
            await new Promise(resolve => setTimeout(resolve, 5));
            await registry.updateLastSeen("conn-2");

            /* After second update, it should not appear in stale list for a threshold after firstTime. */
            const stale = await registry.listStale(firstTime);
            expect(stale.find(c => c.connectionId === "conn-2")).toBeUndefined();
        });
    });

    describe("listStale", () => {
        it("should return connections where lastSeen is older than the threshold", async () => {
            /* Connections now get lastSeen set at registration time, so we need a future
               threshold to find them as stale (the orWhereNull branch remains for AWS rows). */
            await registry.register(makeRegisterParams("conn-null-1"));
            await registry.register(makeRegisterParams("conn-null-2"));

            const futureThreshold = new Date(Date.now() + 60_000);
            const stale = await registry.listStale(futureThreshold);
            const ids = stale.map(c => c.connectionId);
            expect(ids).toContain("conn-null-1");
            expect(ids).toContain("conn-null-2");
        });

        it("should return connections where lastSeen is older than the threshold", async () => {
            await registry.register(makeRegisterParams("conn-old"));
            const past = new Date("2020-01-01T00:00:00.000Z");
            await knex("WebsocketsConnections")
                .where("connectionId", "conn-old")
                .update({ lastSeen: past.toISOString() });

            const threshold = new Date("2021-01-01T00:00:00.000Z");
            const stale = await registry.listStale(threshold);
            const ids = stale.map(c => c.connectionId);
            expect(ids).toContain("conn-old");
        });

        it("should NOT return connections where lastSeen is newer than the threshold", async () => {
            await registry.register(makeRegisterParams("conn-fresh"));
            await registry.updateLastSeen("conn-fresh");

            /* Use a threshold well in the past — conn-fresh was just seen, so it is not stale. */
            const stale = await registry.listStale(new Date("2000-01-01T00:00:00.000Z"));
            const ids = stale.map(c => c.connectionId);
            expect(ids).not.toContain("conn-fresh");
        });

        it("should return an empty array when no connections exist", async () => {
            /* Force table creation by calling listAll. */
            await registry.listAll();
            const stale = await registry.listStale(new Date());
            expect(stale).toEqual([]);
        });

        it("should mix old and recent lastSeen correctly", async () => {
            await registry.register(makeRegisterParams("conn-a"));
            await registry.register(makeRegisterParams("conn-b"));
            await registry.register(makeRegisterParams("conn-c"));

            /* conn-a gets an old lastSeen, conn-b gets another old one, conn-c keeps its recent one. */
            await knex("WebsocketsConnections")
                .where("connectionId", "conn-a")
                .update({ lastSeen: new Date("2020-01-01T00:00:00.000Z").toISOString() });
            await knex("WebsocketsConnections")
                .where("connectionId", "conn-b")
                .update({ lastSeen: new Date("2020-01-01T00:00:00.000Z").toISOString() });

            const threshold = new Date("2021-01-01T00:00:00.000Z");
            const stale = await registry.listStale(threshold);
            const ids = stale.map(c => c.connectionId);

            /* conn-a is old → stale, conn-b is old → stale, conn-c is recent → not stale. */
            expect(ids).toContain("conn-a");
            expect(ids).toContain("conn-b");
            expect(ids).not.toContain("conn-c");
        });
    });

    describe("tableNamePrefix", () => {
        it("should create the table with the prefix applied", async () => {
            const prefixedRegistry = createRegistry(knex, "myapp");
            await prefixedRegistry.register(makeRegisterParams("conn-prefixed"));

            const hasUnprefixed = await knex.schema.hasTable("WebsocketsConnections");
            expect(hasUnprefixed).toBe(false);

            const hasPrefixed = await knex.schema.hasTable("myapp_WebsocketsConnections");
            expect(hasPrefixed).toBe(true);

            const rows = await knex("myapp_WebsocketsConnections").select("connectionId");
            expect(rows).toHaveLength(1);
            expect(rows[0].connectionId).toBe("conn-prefixed");
        });

        it("should use unprefixed table name when no prefix is provided", async () => {
            await registry.register(makeRegisterParams("conn-default"));

            const hasTable = await knex.schema.hasTable("WebsocketsConnections");
            expect(hasTable).toBe(true);

            const rows = await knex("WebsocketsConnections").select("connectionId");
            expect(rows).toHaveLength(1);
            expect(rows[0].connectionId).toBe("conn-default");
        });
    });
});
