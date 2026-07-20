import { describe, it, expect, beforeEach } from "vitest";
import knexLib from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Container } from "@webiny/feature/api";
import { KnexClient } from "@webiny/api-core-sql";
import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { SyncTableManagerFeature } from "../src/features/syncTableManager/feature.js";
import { SyncTableManager } from "../src/features/syncTableManager/abstractions.js";

describe("SyncTableManager", () => {
    let knex: ReturnType<typeof knexLib>;
    let db: InstanceType<typeof PGlite>;
    let server: InstanceType<typeof PGLiteSocketServer>;

    beforeEach(async () => {
        db = await PGlite.create();
        server = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
        await server.start();

        knex = knexLib({
            client: "pg",
            connection: {
                host: "127.0.0.1",
                port: server.port,
                database: "postgres"
            },
            pool: { min: 1, max: 1 }
        });

        return async () => {
            await knex.destroy();
            await server.stop();
            await db.close();
        };
    });

    it("should create sync table on first ensureTable call", async () => {
        const container = new Container();
        container.registerInstance(KnexClient, { client: knex });
        container.registerInstance(TableNameResolverConfig, { sharedTables: false });
        TableNameResolverFeature.register(container);
        SyncTableManagerFeature.register(container);

        const manager = container.resolve(SyncTableManager);
        await manager.ensureTable();

        const exists = await knex.schema.hasTable(manager.getTableName());
        expect(exists).toBe(true);
    });

    it("should be idempotent on repeated ensureTable calls", async () => {
        const container = new Container();
        container.registerInstance(KnexClient, { client: knex });
        container.registerInstance(TableNameResolverConfig, { sharedTables: false });
        TableNameResolverFeature.register(container);
        SyncTableManagerFeature.register(container);

        const manager = container.resolve(SyncTableManager);
        await manager.ensureTable();
        await manager.ensureTable();

        const exists = await knex.schema.hasTable(manager.getTableName());
        expect(exists).toBe(true);
    });

    it("should re-create table after reset", async () => {
        const container = new Container();
        container.registerInstance(KnexClient, { client: knex });
        container.registerInstance(TableNameResolverConfig, { sharedTables: false });
        TableNameResolverFeature.register(container);
        SyncTableManagerFeature.register(container);

        const manager = container.resolve(SyncTableManager);
        await manager.ensureTable();

        await knex.schema.dropTable(manager.getTableName());
        manager.reset();
        await manager.ensureTable();

        const exists = await knex.schema.hasTable(manager.getTableName());
        expect(exists).toBe(true);
    });
});
