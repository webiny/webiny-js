import { describe, expect, it } from "vitest";
import { createServer } from "./createServer.js";
import { acoPg, createPgServer, headlessCmsPg, signingSecret } from "./createPgServer.js";
import { createStorageInspector, SQLITE_STORAGES, STORAGES } from "./inspectStorages.js";

/**
 * The root container keeps only the connection: every storage (core, audit logs, the websocket
 * connection registry, the login, and ACO's folder-level permissions on SQLite) registers in each request's container. An extension's decorators
 * reach all of them, as they are resolved in the request's container.
 */
const names = (storages: typeof STORAGES) => storages.map(([name]) => name);

describe("api-event-handler-standalone-sql — storages per request", () => {
    it("on SQLite, the root holds no storage and a request's container holds all of them", async () => {
        const { extension, reports } = createStorageInspector(SQLITE_STORAGES);
        const server = await createServer(() => [extension]);

        let before = 0;
        try {
            before = reports.length;
            await server.graphql("{ __typename }");
        } finally {
            await server.close();
        }

        // The request, and also the events the server dispatches on start (scheduler recovery).
        expect(reports.length).toBeGreaterThan(before);
        for (const report of reports) {
            expect(report).toEqual({ inRoot: [], inRequest: names(SQLITE_STORAGES) });
        }
    });

    it("on PGlite, the root holds no storage and a request's container holds all of them", async () => {
        const { extension, reports } = createStorageInspector(STORAGES);
        const server = await createPgServer({
            extensions: [signingSecret, headlessCmsPg, acoPg, extension]
        });

        let before = 0;
        try {
            before = reports.length;
            await server.graphql("{ __typename }");
        } finally {
            await server.close();
        }

        expect(reports.length).toBeGreaterThan(before);
        for (const report of reports) {
            expect(report).toEqual({ inRoot: [], inRequest: names(STORAGES) });
        }
    });

    /*
     * The storages are built per request, but what they learn about their tables is the process's,
     * in one schema memory per connection and table set: serving more requests adds none.
     */
    it("holds no more schema memory after many requests than after the first", async () => {
        const countMemories = () => {
            const g = globalThis as Record<string, unknown>;
            return ((g.__sqlTableManagers ?? []) as unknown[]).length;
        };
        const server = await createServer();
        try {
            await server.graphql("{ __typename }");
            const afterFirst = countMemories();
            for (let request = 0; request < 20; request++) {
                await server.graphql("{ __typename }");
            }
            expect(countMemories()).toBe(afterFirst);
        } finally {
            await server.close();
        }
    });
});
