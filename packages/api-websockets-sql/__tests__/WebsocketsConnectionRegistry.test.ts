import { describe, it, expect, beforeEach, afterEach } from "vitest";
import knexLib from "knex";
import type { Knex } from "knex";
import { WebsocketsConnectionRegistry } from "../src/WebsocketsConnectionRegistry.js";
import type { IWebsocketsConnectionRegistryRegisterParams } from "@webiny/api-websockets";

const makeRegisterParams = (connectionId: string): IWebsocketsConnectionRegistryRegisterParams => ({
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

describe("WebsocketsConnectionRegistry (SQL)", () => {
    let knex: Knex;
    let registry: WebsocketsConnectionRegistry;

    beforeEach(() => {
        knex = knexLib({
            client: "better-sqlite3",
            connection: {
                filename: ":memory:"
            },
            useNullAsDefault: true
        });
        registry = new WebsocketsConnectionRegistry({ knex });
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
        it("should return connections where lastSeen is NULL", async () => {
            await registry.register(makeRegisterParams("conn-null-1"));
            await registry.register(makeRegisterParams("conn-null-2"));

            const stale = await registry.listStale(new Date());
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

        it("should mix NULL and old lastSeen correctly", async () => {
            await registry.register(makeRegisterParams("conn-a"));
            await registry.register(makeRegisterParams("conn-b"));
            await registry.register(makeRegisterParams("conn-c"));

            /* conn-b gets an old lastSeen, conn-c gets a recent one. */
            await knex("WebsocketsConnections")
                .where("connectionId", "conn-b")
                .update({ lastSeen: new Date("2020-01-01T00:00:00.000Z").toISOString() });
            await registry.updateLastSeen("conn-c");

            const threshold = new Date("2021-01-01T00:00:00.000Z");
            const stale = await registry.listStale(threshold);
            const ids = stale.map(c => c.connectionId);

            /* conn-a is NULL → stale, conn-b is old → stale, conn-c is recent → not stale. */
            expect(ids).toContain("conn-a");
            expect(ids).toContain("conn-b");
            expect(ids).not.toContain("conn-c");
        });
    });
});
