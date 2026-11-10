import { afterEach, describe, expect, it } from "vitest";
import knexLib, { type Knex } from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createRegisterBuildParamPlugin } from "@webiny/handler";
import { BuildParam } from "@webiny/api-core/features/buildParams/index.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createPgStorage } from "@webiny/api-storage-pg";
import { postgresModules } from "./startPglite.js";
import { readCatalog } from "./readCatalog.js";

/**
 * The Postgres storage's schema setup, with the modules a Postgres project adds (`<HeadlessCmsPg />`,
 * `<AcoPg />`). It runs before the API takes traffic: at deploy time on Lambda, at start on a server.
 * Several processes can start together, so it runs in one transaction behind one advisory lock.
 */

/**
 * A fresh in-memory Postgres (PGlite) over the wire protocol. With more than one connection, PGlite
 * runs one transaction at a time: another connection's statements wait until it ends.
 */
const startPglite = async ({ maxConnections = 1 } = {}) => {
    const db = await PGlite.create();
    const server = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1", maxConnections });
    await server.start();
    const port = (server as unknown as { port: number }).port;

    const clients: Knex[] = [];
    const createKnex = (): Knex => {
        const knex = knexLib({
            client: "pg",
            connection: {
                host: "127.0.0.1",
                port,
                user: "postgres",
                password: "postgres",
                database: "postgres"
            },
            pool: { min: 0, max: 1 }
        });
        clients.push(knex);
        return knex;
    };

    const stop = async () => {
        await Promise.all(clients.map(knex => knex.destroy()));
        await server.stop();
        await db.close();
    };

    return { createKnex, stop };
};

/** The `HeadlessCmsPg` build param `<HeadlessCmsPg slotIndexes={false} />` generates. */
const withoutSlotIndexes = createRegisterBuildParamPlugin(ctx => {
    ctx.container.registerInstance(BuildParam, {
        key: "HeadlessCmsPg",
        value: { slotIndexes: false }
    });
});

/** The schema one setup leaves on an empty database. */
const catalogAfterOneSetup = async (extensions: unknown[] = postgresModules) => {
    const pglite = await startPglite();
    try {
        const knex = pglite.createKnex();
        await createPgStorage({ knex }).setupSchema(extensions);
        return await readCatalog(knex);
    } finally {
        await pglite.stop();
    }
};

describe("createPgStorage — schema setup", () => {
    let pglite: Awaited<ReturnType<typeof startPglite>> | undefined;

    afterEach(async () => {
        ServiceDiscovery.clear();
        await pglite?.stop();
        pglite = undefined;
    });

    it("runs every step in one transaction that takes the advisory lock first", async () => {
        pglite = await startPglite();
        const knex = pglite.createKnex();
        const statements: string[] = [];
        knex.on("query", (query: { sql: string }) => statements.push(query.sql.trim()));

        const done = await createPgStorage({ knex }).setupSchema(postgresModules);

        expect(done).toEqual(["core", "websockets", "cms", "aco"]);
        expect(statements[0]).toMatch(/^BEGIN/i);
        expect(statements[1]).toMatch(/^SELECT pg_advisory_xact_lock\(hashtext\(/);
        expect(statements[statements.length - 1]).toMatch(/^COMMIT/i);
        // Nothing commits on the way: the parts that open a transaction of their own nest in it.
        const inside = statements.slice(1, -1);
        expect(inside.filter(sql => /^(BEGIN|COMMIT|ROLLBACK)\b/i.test(sql))).toEqual([]);
        expect(inside.filter(sql => /^create table/i.test(sql)).length).toBeGreaterThan(0);
    });

    it("lets two setups that start together both succeed, and leaves the schema one setup leaves", async () => {
        const expected = await catalogAfterOneSetup();

        pglite = await startPglite({ maxConnections: 2 });
        const first = pglite.createKnex();
        const second = pglite.createKnex();

        const results = await Promise.all([
            createPgStorage({ knex: first }).setupSchema(postgresModules),
            createPgStorage({ knex: second }).setupSchema(postgresModules)
        ]);

        expect(results[0]).toEqual(results[1]);
        expect(await readCatalog(first)).toEqual(expected);
    });

    it("creates nothing on a second run", async () => {
        pglite = await startPglite();
        const knex = pglite.createKnex();

        await createPgStorage({ knex }).setupSchema(postgresModules);
        const catalog = await readCatalog(knex);

        const statements: string[] = [];
        knex.on("query", (query: { sql: string }) => statements.push(query.sql.trim()));
        await createPgStorage({ knex }).setupSchema(postgresModules);

        expect(await readCatalog(knex)).toEqual(catalog);
        // Additive only: a second run drops nothing. (The CMS re-applies its idempotent
        // `ADD COLUMN IF NOT EXISTS` and `SET STATISTICS`, which change nothing above.)
        expect(statements.filter(sql => /^drop\s/i.test(sql))).toEqual([]);
    });

    it("refuses the folder catalog without the CMS module, naming <HeadlessCmsPg />, and creates nothing", async () => {
        pglite = await startPglite();
        const knex = pglite.createKnex();
        const [, acoOnly] = postgresModules;

        await expect(createPgStorage({ knex }).setupSchema([acoOnly])).rejects.toThrow(
            "add <HeadlessCmsPg /> (from @webiny/api-headless-cms-pg/project) to webiny.config.tsx."
        );
        const tables = await knex.raw(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        );
        expect(tables.rows).toEqual([]);
    });

    it("creates no per-slot indexes when the CMS module's settings turn them off", async () => {
        const withIndexes = await catalogAfterOneSetup();
        const withoutIndexes = await catalogAfterOneSetup([withoutSlotIndexes, ...postgresModules]);

        const missing = withIndexes.filter(item => !withoutIndexes.includes(item));
        // One partial btree per scalar slot of the search table, and nothing else.
        expect(missing.length).toBeGreaterThan(10);
        expect(missing.every(item => /^index .*webiny_cms_search_/.test(item))).toBe(true);
        expect(withoutIndexes.filter(item => !withIndexes.includes(item))).toEqual([]);
    });
});
