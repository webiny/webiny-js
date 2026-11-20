import { afterEach, describe, expect, it } from "vitest";
import knexLib, { type Knex } from "knex";
import { Container, type Abstraction } from "@webiny/di";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
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
import { createPgStorage } from "~/index.js";

/**
 * The Postgres storage is generic: SQL core, websockets and audit logs. The CMS and ACO on Postgres
 * are modules the project adds with its extensions; their setup tests live with the handlers that
 * run them (`@webiny/api-event-handler-aws-pg`).
 */

const startPglite = async () => {
    const db = await PGlite.create();
    const server = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
    await server.start();
    const knex = knexLib({
        client: "pg",
        connection: {
            host: "127.0.0.1",
            port: (server as unknown as { port: number }).port,
            user: "postgres",
            password: "postgres",
            database: "postgres"
        },
        pool: { min: 0, max: 1 }
    });

    const stop = async () => {
        await knex.destroy();
        await server.stop();
        await db.close();
    };

    return { knex, stop };
};

/*
 * What a request registers, as far as the storage goes: its `RequestStorage`s. The transport's
 * registration adds the API's features and the project's extensions (the CMS and ACO modules).
 */
const registerStorages: ISqlSchemaSetupRequest = {
    async register(container) {
        for (const storage of container.resolveAll(RequestStorage)) {
            await storage.register(container);
        }
    }
};

/** Stands in for the CMS module's step, which `<HeadlessCmsPg />` registers. */
class CmsStepImpl implements SqlSchemaSetup.Interface {
    public readonly name = "cms";
    public async setup(): Promise<void> {}
}

const CmsStep = SqlSchemaSetup.createImplementation({
    implementation: CmsStepImpl,
    dependencies: []
});

const listTables = async (knex: Knex): Promise<string[]> => {
    const result = await knex.raw("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    return result.rows.map((row: { tablename: string }) => row.tablename);
};

describe("createPgStorage", () => {
    let pglite: Awaited<ReturnType<typeof startPglite>> | undefined;

    afterEach(async () => {
        ServiceDiscovery.clear();
        await pglite?.stop();
        pglite = undefined;
    });

    it("registers SQL core, websockets and audit logs, with no CMS and no ACO", async () => {
        pglite = await startPglite();
        const root = new Container();

        createPgStorage({ knex: pglite.knex, tableNamePrefix: "p" }).register(root);

        // The root holds the connection and what the modules on the storage read: the table prefix
        // and the schema-managed setting. No storage.
        expect(root.resolve(KnexClient).client).toBe(pglite.knex);
        const schemaConfig = root.resolve(SqlSchemaConfig);
        expect(schemaConfig.tableNamePrefix).toBe("p");
        expect(schemaConfig.isManaged()).toBe(false);
        const storages: Abstraction<unknown>[] = [
            ApiCoreStorageOperationsFactory,
            AuditLogsStorage,
            ConnectionRegistry
        ];
        for (const abstraction of storages) {
            expect(() => root.resolve(abstraction)).toThrow();
        }
        expect(root.resolveAll(SqlSchemaSetup)).toEqual([]);
        expect(root.resolve(SqlSchemaSetupRunner)).toBeTruthy();

        // A request's container, as `registerApiRequestStack` starts it, gets every storage.
        const request = root.createChildContainer();
        for (const storage of request.resolveAll(RequestStorage)) {
            await storage.register(request);
        }
        for (const abstraction of storages) {
            expect(request.resolve(abstraction)).toBeTruthy();
        }
        const steps = request.resolveAll(SqlSchemaSetup).map(step => step.name);
        expect(steps).toEqual(["core", "auditLogs", "websockets"]);
    });

    it("is schema-managed from the start when asked", async () => {
        pglite = await startPglite();
        const managed = new Container();
        createPgStorage({ knex: pglite.knex, schemaManaged: true }).register(managed);
        expect(managed.resolve(SqlSchemaConfig).isManaged()).toBe(true);
    });

    it("runs its setup in one transaction that takes the advisory lock first, then is schema-managed", async () => {
        pglite = await startPglite();
        const root = new Container();
        createPgStorage({ knex: pglite.knex }).register(root);
        expect(root.resolve(SqlSchemaConfig).isManaged()).toBe(false);
        const statements: string[] = [];
        pglite.knex.on("query", (query: { sql: string }) => statements.push(query.sql.trim()));
        const seen: Knex[] = [];

        // With a CMS step, as `<HeadlessCmsPg />` adds one: the storage can't run without it.
        const done = await root.resolve(SqlSchemaSetupRunner).run({
            request: {
                async register(container) {
                    seen.push(container.resolve(KnexClient).client);
                    await registerStorages.register(container);
                    container.register(CmsStep);
                }
            }
        });

        expect(done).toEqual(["core", "auditLogs", "websockets", "cms"]);
        expect(seen[0].isTransaction).toBe(true);
        expect(statements[0]).toMatch(/^BEGIN/i);
        expect(statements[1]).toMatch(/^SELECT pg_advisory_xact_lock\(hashtext\(/);
        expect(statements[statements.length - 1]).toMatch(/^COMMIT/i);
        expect(root.resolve(SqlSchemaConfig).isManaged()).toBe(true);
    });

    it("refuses to set up without the CMS module, naming <HeadlessCmsPg />, and creates nothing", async () => {
        pglite = await startPglite();
        const root = new Container();
        createPgStorage({ knex: pglite.knex }).register(root);

        await expect(
            root.resolve(SqlSchemaSetupRunner).run({ request: registerStorages })
        ).rejects.toThrow(
            "The Postgres storage has no CMS storage: add <HeadlessCmsPg /> (from @webiny/api-headless-cms-pg/project) to webiny.config.tsx."
        );
        expect(await listTables(pglite.knex)).toEqual([]);

        // And it doesn't go schema-managed on a failed setup.
        expect(root.resolve(SqlSchemaConfig).isManaged()).toBe(false);
    });
});
