import knexLib from "knex";
import { createServer } from "net";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketHandler } from "@electric-sql/pglite-socket";

export async function createKnex() {
    const db = await PGlite.create();
    const handler = new PGLiteSocketHandler({ db, closeOnDetach: true });

    const server = createServer(async socket => {
        await handler.attach(socket);
    });

    await new Promise(resolve => {
        server.listen(0, "127.0.0.1", resolve);
    });

    const { port } = server.address();

    global.__testPglite = db;
    global.__testPgliteServer = server;

    return knexLib({
        client: "pg",
        connection: {
            host: "127.0.0.1",
            port,
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
        await knex.destroy();
    }

    const server = global.__testPgliteServer;
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }

    const db = global.__testPglite;
    if (db) {
        await db.close();
    }
}
