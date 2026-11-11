import { afterEach, describe, expect, it } from "vitest";
import knexLib, { type Knex } from "knex";
import { Container } from "@webiny/di";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { ApiCoreStorageOperationsFactory, RequestStorage } from "@webiny/api-core";
import { KnexClient, SqlSchemaConfig, SqlSchemaSetup } from "@webiny/api-core-sql";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { createSqliteStorage } from "~/index.js";

/**
 * The SQLite storage of the standalone server: the server sets its schema up at start, then runs
 * schema-managed, so setup must create every table the lazy checks would.
 */

const listTables = async (knex: Knex): Promise<string[]> => {
    const rows: { name: string }[] = await knex("sqlite_master")
        .where("type", "table")
        .whereNot("name", "like", "sqlite_%")
        .select("name");
    return rows.map(row => row.name).sort();
};

describe("createSqliteStorage", () => {
    let knex: Knex | undefined;

    const connect = () => {
        knex = knexLib({
            client: "better-sqlite3",
            connection: { filename: ":memory:" },
            useNullAsDefault: true
        });
        return knex;
    };

    afterEach(async () => {
        ServiceDiscovery.clear();
        await knex?.destroy();
        knex = undefined;
    });

    it("creates the tables of core, audit logs, websockets, the CMS and ACO", async () => {
        const db = connect();
        const done = await createSqliteStorage({ knex: db }).setupSchema();

        expect([...done].sort()).toEqual(["aco", "auditLogs", "cms", "core", "websockets"]);
        expect(await listTables(db)).toEqual(
            expect.arrayContaining([
                "webiny_service_manifests",
                "webiny_audit_logs",
                "webiny_aco_flp",
                "WebsocketsConnections",
                expect.stringMatching(/cms.*models/i),
                expect.stringMatching(/cms.*groups/i),
                expect.stringMatching(/cms.*entries/i)
            ])
        );
    });

    it("creates nothing on a second run", async () => {
        const db = connect();
        await createSqliteStorage({ knex: db }).setupSchema();
        const tables = await listTables(db);

        await createSqliteStorage({ knex: db }).setupSchema();

        expect(await listTables(db)).toEqual(tables);
    });

    it("applies extensions that read the feature flags and the license while they register", async () => {
        // As built-in extensions do (Languages, Collaboration): they decide whether to register.
        const read: string[] = [];
        const gated = createRegisterExtensionPlugin(({ container }) => {
            container.resolve(FeatureFlags).get().isEnabled("languages");
            container.resolve(WcpContext).canUseComments();
            read.push("read");
        });

        const done = await createSqliteStorage({ knex: connect() }).setupSchema([gated]);

        expect(read).toEqual(["read"]);
        expect(done).toContain("cms");
    });

    it("registers schema-managed after its setup, and not before", async () => {
        const storage = createSqliteStorage({ knex: connect() });

        const before = new Container();
        storage.register(before);
        expect(before.resolve(SqlSchemaConfig).isManaged()).toBe(false);

        await storage.setupSchema();
        const after = new Container();
        storage.register(after);
        expect(after.resolve(SqlSchemaConfig).isManaged()).toBe(true);
    });

    it("registers only the connection in the root, and every storage in a request's container", async () => {
        const db = connect();
        const root = new Container();
        createSqliteStorage({ knex: db, tableNamePrefix: "r" }).register(root);

        // The root: the connection and its settings, and what registers the storages per request.
        expect(root.resolve(KnexClient).client).toBe(db);
        expect(root.resolve(SqlSchemaConfig).tableNamePrefix).toBe("r");
        const storages = [
            ApiCoreStorageOperationsFactory,
            AuditLogsStorage,
            ConnectionRegistry,
            FlpStorageOperations
        ];
        for (const abstraction of storages) {
            expect(() => root.resolve(abstraction)).toThrow();
        }
        expect(root.resolveAll(SqlSchemaSetup)).toEqual([]);

        // A request's container, as `registerApiRequestStack` starts it.
        const request = root.createChildContainer();
        for (const storage of request.resolveAll(RequestStorage)) {
            await storage.register(request);
        }
        for (const abstraction of storages) {
            expect(request.resolve(abstraction)).toBeTruthy();
        }
        const steps = request.resolveAll(SqlSchemaSetup).map(step => step.name);
        expect(steps.sort()).toEqual(["aco", "auditLogs", "cms", "core", "websockets"]);
    });
});
