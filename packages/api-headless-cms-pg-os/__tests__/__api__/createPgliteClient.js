import knexLib from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

export async function createKnex() {
    const db = await PGlite.create();
    const server = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
    await server.start();

    global.__testPglite = db;
    global.__testPgliteServer = server;

    return knexLib({
        client: "pg",
        connection: {
            host: "127.0.0.1",
            port: server.port,
            database: "postgres"
        },
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

    const server = global.__testPgliteServer;
    if (server) {
        global.__testPgliteServer = null;
        await server.stop();
    }

    const db = global.__testPglite;
    if (db) {
        global.__testPglite = null;
        await db.close();
    }
}
