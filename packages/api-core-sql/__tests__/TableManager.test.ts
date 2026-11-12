import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { afterEach } from "vitest";
import knexLib from "knex";
import type { Knex } from "knex";
import { Container } from "@webiny/feature/api";
import { ApiCoreStorageOperationsFactory } from "@webiny/api-core";
import { TableManager } from "~/TableManager.js";
import { ApiCoreSqlFeature } from "~/coreStorage/index.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { SqlConnectionFeature, setSqlServiceManifestLoader } from "~/connection/index.js";
import { SqlSchemaSetup } from "~/schemaSetup/index.js";

const createKnex = (): Knex => {
    return knexLib({
        client: "better-sqlite3",
        connection: {
            filename: ":memory:"
        },
        useNullAsDefault: true
    });
};

/* The process's schema memories (and, before this storage was per request, its table managers). */
const countMemories = (): number => {
    const g = globalThis as Record<string, unknown>;
    const memories = (g.__sqlTableManagers ?? []) as unknown[];
    return memories.length;
};

/* Counts the table-existence checks a connection runs. */
const countTableChecks = (knex: Knex) => {
    let checks = 0;
    knex.on("query", (query: { sql: string }) => {
        if (/sqlite_master/i.test(query.sql)) {
            checks++;
        }
    });
    return () => checks;
};

const createItemsTable = (table: Knex.CreateTableBuilder) => {
    table.text("id").primary();
};

describe("TableManager", () => {
    let knex: Knex | undefined;

    afterEach(async () => {
        await knex?.destroy();
        knex = undefined;
    });

    it("creates a table once when concurrent callers ensure it at the same time", async () => {
        knex = createKnex();
        const tableManager = new TableManager(knex);

        const calls = Array.from({ length: 5 }, () => {
            return tableManager.ensure("items", createItemsTable);
        });
        await Promise.all(calls);

        const exists = await knex.schema.hasTable("items");
        expect(exists).toBe(true);
    });

    it("succeeds when the table was created by someone else in the meantime", async () => {
        knex = createKnex();
        const first = new TableManager(knex, "race");
        const second = new TableManager(knex, "race");

        const calls = [
            first.ensure("items", createItemsTable),
            second.ensure("items", createItemsTable)
        ];
        await Promise.all(calls);

        const exists = await knex.schema.hasTable("race_items");
        expect(exists).toBe(true);
    });

    it("remembers a checked table for its connection, not for itself", async () => {
        knex = createKnex();
        const checks = countTableChecks(knex);

        await new TableManager(knex, "shared").ensure("items", createItemsTable);
        const afterFirst = checks();
        await new TableManager(knex, "shared").ensure("items", createItemsTable);

        expect(afterFirst).toBeGreaterThan(0);
        expect(checks()).toBe(afterFirst);
    });

    it("never checks a table when schema-managed", async () => {
        knex = createKnex();
        const checks = countTableChecks(knex);

        await new TableManager(knex, "managed", { schemaManaged: true }).ensure(
            "items",
            createItemsTable
        );

        expect(checks()).toBe(0);
        expect(await knex.schema.hasTable("managed_items")).toBe(false);
    });

    it("reads a schema-managed function on every ensure, so a later switch takes effect", async () => {
        knex = createKnex();
        const checks = countTableChecks(knex);
        let managed = false;
        const tableManager = new TableManager(knex, "live", { schemaManaged: () => managed });

        managed = true;
        await tableManager.ensure("items", createItemsTable);

        expect(checks()).toBe(0);
        expect(await knex.schema.hasTable("live_items")).toBe(false);

        managed = false;
        await tableManager.ensure("items", createItemsTable);

        expect(await knex.schema.hasTable("live_items")).toBe(true);
    });
});

describe("setSqlServiceManifestLoader", () => {
    let knex: Knex | undefined;

    afterEach(async () => {
        ServiceDiscovery.clear();
        await knex?.destroy();
        knex = undefined;
    });

    /*
     * A server registers its storage (and sets the loader) before its schema setup at start, then
     * turns schema-managed on: the loader must follow, not keep the setting it was given.
     */
    it("follows a schema-managed setting that is turned on after the loader was set", async () => {
        knex = createKnex();
        const checks = countTableChecks(knex);
        let managed = false;
        setSqlServiceManifestLoader({ knex, schemaManaged: () => managed });

        managed = true;
        await expect(ServiceDiscovery.load()).rejects.toThrow(/no such table/);

        expect(checks()).toBe(0);
        expect(await knex.schema.hasTable("webiny_service_manifests")).toBe(false);
    });
});

describe("ApiCoreSqlFeature", () => {
    let knex: Knex | undefined;

    afterEach(async () => {
        await knex?.destroy();
        knex = undefined;
    });

    /*
     * The core storage is registered in each request's container and built there, on the
     * connection in the root. What it learns about its tables is the process's: a server that has
     * served many requests holds one memory for the connection, and checks each table once.
     */
    it("is built per request, and the process keeps one memory per connection", async () => {
        knex = createKnex();
        const checks = countTableChecks(knex);
        const root = new Container();
        SqlConnectionFeature.register(root, { knex, tableNamePrefix: "many" });

        const before = countMemories();
        const built = new Set<unknown>();
        for (let request = 0; request < 25; request++) {
            const container = root.createChildContainer();
            ApiCoreSqlFeature.register(container);
            const operations = container.resolve(ApiCoreStorageOperationsFactory).create();
            built.add(operations);
            await operations.keyValueStorageOperations.get("key", "scope");
        }
        const checksAfterFirstRequests = checks();

        expect(built.size).toBe(25);
        expect(countMemories() - before).toBe(1);
        // The key-value store's two tables, checked by the first request only.
        expect(checksAfterFirstRequests).toBeGreaterThan(0);
        expect(checksAfterFirstRequests).toBeLessThanOrEqual(4);
    });

    it("registers no storage in the root: the connection only", () => {
        knex = createKnex();
        const root = new Container();
        SqlConnectionFeature.register(root, { knex });

        expect(() => root.resolve(ApiCoreStorageOperationsFactory)).toThrow();
        expect(root.resolveAll(SqlSchemaSetup)).toEqual([]);
    });

    it("sets up the core tables, including the service manifests, on the container's connection", async () => {
        knex = createKnex();
        const container = new Container();
        SqlConnectionFeature.register(container, { knex, tableNamePrefix: "setup" });
        ApiCoreSqlFeature.register(container);

        const [step] = container.resolveAll(SqlSchemaSetup);
        expect(step.name).toBe("core");
        await step.setup();

        const tables = await knex("sqlite_master").where("type", "table").pluck("name");
        expect(tables).toEqual(
            expect.arrayContaining([
                "setup_webiny_service_manifests",
                "setup_webiny_core_tenants",
                "setup_webiny_core_admin_users"
            ])
        );
    });
});
