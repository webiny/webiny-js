import knexLib from "knex";

const host = process.env.WEBINY_PG_HOST || "localhost";
const port = Number(process.env.WEBINY_PG_PORT || 5432);
const database = process.env.WEBINY_PG_DATABASE || "webiny_test";
const user = process.env.WEBINY_PG_USER || process.env.USER;
const password = process.env.WEBINY_PG_PASSWORD || "";

async function ensureDatabase() {
    const admin = knexLib({
        client: "pg",
        connection: { host, port, user, password, database: "postgres" },
        pool: { min: 1, max: 1 }
    });

    const result = await admin.raw("SELECT 1 FROM pg_database WHERE datname = ?", [database]);
    if (result.rows.length === 0) {
        await admin.raw(`CREATE DATABASE "${database}"`);
    }

    await admin.destroy();
}

export async function createKnex() {
    await ensureDatabase();

    return knexLib({
        client: "pg",
        connection: { host, port, database, user, password },
        pool: { min: 1, max: 1 }
    });
}

export async function dropAllTables(knex) {
    const result = await knex.raw("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    for (const { tablename } of result.rows) {
        await knex.raw(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
    }
}

export async function teardown() {
    const knex = global.__testKnex;
    if (knex) {
        global.__testKnex = null;
        await knex.destroy();
    }
}
