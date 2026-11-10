import { afterEach, describe, expect, it } from "vitest";
import knexLib, { type Knex } from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import type { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { setupPgSchema } from "~/index.js";

/**
 * Schema setup runs before the API takes traffic: at deploy time on Lambda, at start on a server.
 * Several processes can start together, so it runs in one transaction behind one advisory lock.
 */

/** No `Pg*` build params: the CMS storage's defaults. */
const buildParams: BuildParams.Interface = { get: () => null };

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

/** Every table, column, index, function and trigger in the database, sorted. */
const readCatalog = async (knex: Knex): Promise<string[]> => {
    const result = await knex.raw(`
        SELECT 'table ' || tablename AS item FROM pg_tables WHERE schemaname = 'public'
        UNION ALL
        SELECT 'column ' || table_name || '.' || column_name || ' ' || data_type
            FROM information_schema.columns WHERE table_schema = 'public'
        UNION ALL
        SELECT 'index ' || indexname FROM pg_indexes WHERE schemaname = 'public'
        UNION ALL
        SELECT 'function ' || p.proname FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'
        UNION ALL
        SELECT 'trigger ' || t.tgname FROM pg_trigger t
            JOIN pg_class c ON c.oid = t.tgrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND NOT t.tgisinternal
    `);
    return result.rows.map((row: { item: string }) => row.item).sort();
};

/** The schema one setup leaves on an empty database. */
const catalogAfterOneSetup = async (): Promise<string[]> => {
    const pglite = await startPglite();
    try {
        const knex = pglite.createKnex();
        await setupPgSchema({ knex, buildParams });
        return await readCatalog(knex);
    } finally {
        await pglite.stop();
    }
};

describe("setupPgSchema", () => {
    let pglite: Awaited<ReturnType<typeof startPglite>> | undefined;

    afterEach(async () => {
        ServiceDiscovery.clear();
        await pglite?.stop();
        pglite = undefined;
    });

    it("runs the whole setup in one transaction that takes the advisory lock first", async () => {
        pglite = await startPglite();
        const knex = pglite.createKnex();
        const statements: string[] = [];
        knex.on("query", (query: { sql: string }) => statements.push(query.sql.trim()));

        await setupPgSchema({ knex, buildParams });

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
            setupPgSchema({ knex: first, buildParams }),
            setupPgSchema({ knex: second, buildParams })
        ]);

        expect(results[0]).toEqual(results[1]);
        expect(await readCatalog(first)).toEqual(expected);
    });

    it("creates nothing on a second run", async () => {
        pglite = await startPglite();
        const knex = pglite.createKnex();

        await setupPgSchema({ knex, buildParams });
        const catalog = await readCatalog(knex);

        const statements: string[] = [];
        knex.on("query", (query: { sql: string }) => statements.push(query.sql.trim()));
        await setupPgSchema({ knex, buildParams });

        expect(await readCatalog(knex)).toEqual(catalog);
        // Additive only: a second run drops nothing. (The CMS re-applies its idempotent
        // `ADD COLUMN IF NOT EXISTS` and `SET STATISTICS`, which change nothing above.)
        expect(statements.filter(sql => /^drop\s/i.test(sql))).toEqual([]);
    });
});
