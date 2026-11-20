import { afterEach, describe, expect, it } from "vitest";
import knexLib, { type Knex } from "knex";
import { Container, type Abstraction } from "@webiny/di";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { ApiCoreStorageOperationsFactory, RequestStorage } from "@webiny/api-core";
import {
    KnexClient,
    SqlSchemaConfig,
    SqlSchemaSetup,
    SqlSchemaSetupRunner,
    type ISqlSchemaSetupRequest
} from "@webiny/api-core-sql";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { createSqliteStorage } from "~/index.js";

/**
 * The SQLite storage of the standalone server: the server sets its schema up at start, then runs
 * schema-managed, so setup must create every table the lazy checks would.
 */

/*
 * What a request registers, as far as the storage goes: its `RequestStorage`s. The transport's
 * registration adds the API's features and the project's extensions.
 */
const registerStorages: ISqlSchemaSetupRequest = {
    async register(container) {
        for (const storage of container.resolveAll(RequestStorage)) {
            await storage.register(container);
        }
    }
};

/** Registers the storage in a root of its own and runs its schema setup there. */
const runSetup = async (
    storage: ReturnType<typeof createSqliteStorage>,
    request: ISqlSchemaSetupRequest = registerStorages
): Promise<string[]> => {
    const root = new Container();
    storage.register(root);
    return root.resolve(SqlSchemaSetupRunner).run({ request });
};

/** A step that fails after the others created their tables. */
class FailingSchemaSetupImpl implements SqlSchemaSetup.Interface {
    public readonly name = "failing";
    public async setup(): Promise<void> {
        throw new Error("The last step failed.");
    }
}

const FailingSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: FailingSchemaSetupImpl,
    dependencies: []
});

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
        const done = await runSetup(createSqliteStorage({ knex: db }));

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
        await runSetup(createSqliteStorage({ knex: db }));
        const tables = await listTables(db);

        await runSetup(createSqliteStorage({ knex: db }));

        expect(await listTables(db)).toEqual(tables);
    });

    it("builds the setup's container on its transaction, with schema-managed off", async () => {
        const db = connect();
        const seen: { knex: Knex; managed: boolean }[] = [];
        const request: ISqlSchemaSetupRequest = {
            async register(container) {
                seen.push({
                    knex: container.resolve(KnexClient).client,
                    managed: container.resolve(SqlSchemaConfig).isManaged()
                });
                await registerStorages.register(container);
            }
        };

        await runSetup(createSqliteStorage({ knex: db }), request);

        expect(seen).toHaveLength(1);
        expect(seen[0].knex).not.toBe(db);
        expect(seen[0].knex.isTransaction).toBe(true);
        expect(seen[0].managed).toBe(false);
    });

    it("is schema-managed after its setup, and not before", async () => {
        const root = new Container();
        createSqliteStorage({ knex: connect() }).register(root);
        expect(root.resolve(SqlSchemaConfig).isManaged()).toBe(false);

        await root.resolve(SqlSchemaSetupRunner).run({ request: registerStorages });

        expect(root.resolve(SqlSchemaConfig).isManaged()).toBe(true);
    });

    it("rolls a failed setup back, and stays unmanaged", async () => {
        const db = connect();
        const root = new Container();
        createSqliteStorage({ knex: db }).register(root);
        const failing: ISqlSchemaSetupRequest = {
            async register(container) {
                await registerStorages.register(container);
                container.register(FailingSchemaSetup);
            }
        };

        await expect(root.resolve(SqlSchemaSetupRunner).run({ request: failing })).rejects.toThrow(
            "The last step failed."
        );

        expect(await listTables(db)).toEqual([]);
        expect(root.resolve(SqlSchemaConfig).isManaged()).toBe(false);
    });

    it("registers only the connection in the root, and every storage in a request's container", async () => {
        const db = connect();
        const root = new Container();
        createSqliteStorage({ knex: db, tableNamePrefix: "r" }).register(root);

        // The root: the connection and its settings, and what registers the storages per request.
        expect(root.resolve(KnexClient).client).toBe(db);
        expect(root.resolve(SqlSchemaConfig).tableNamePrefix).toBe("r");
        const storages: Abstraction<unknown>[] = [
            ApiCoreStorageOperationsFactory,
            AuditLogsStorage,
            ConnectionRegistry,
            FlpStorageOperations
        ];
        for (const abstraction of storages) {
            expect(() => root.resolve(abstraction)).toThrow();
        }
        expect(root.resolveAll(SqlSchemaSetup)).toEqual([]);
        expect(root.resolve(SqlSchemaSetupRunner)).toBeTruthy();

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
