import knexLib, { type Knex } from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { HeadlessCmsPgExtension } from "@webiny/api-headless-cms-pg";
import { AcoPgExtension } from "@webiny/api-aco-pg";
import { createAwsPgApiHandler, SQL_SCHEMA_SETUP_EVENT_IDENTIFIER } from "~/index.js";

/**
 * The Postgres modules a project adds with `<HeadlessCmsPg />` and `<AcoPg />`, as they land in its
 * `extensions.ts`: every function of a Postgres project's API gets them.
 */
export const postgresModules = [
    createRegisterExtensionPlugin(ctx => {
        HeadlessCmsPgExtension.register(ctx.container);
    }),
    createRegisterExtensionPlugin(ctx => {
        AcoPgExtension.register(ctx.container);
    })
];

/**
 * A fresh in-memory Postgres (PGlite) over the wire protocol, as `<Infra.Pglite>` runs it. It serves
 * one connection at a time, so every client of it keeps a pool of one.
 */
export const startPglite = async () => {
    const db = await PGlite.create();
    const socketServer = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
    await socketServer.start();
    const port = (socketServer as unknown as { port: number }).port;

    /** The `WEBINY_PG_*` settings that point at this database. */
    const env = {
        WEBINY_PG_HOST: "127.0.0.1",
        WEBINY_PG_PORT: String(port),
        WEBINY_PG_USER: "postgres",
        WEBINY_PG_DATABASE: "postgres",
        WEBINY_PG_POOL_MAX: "1"
    };

    const createKnex = (): Knex => {
        return knexLib({
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
    };

    /**
     * Sets the schema up as a deploy does: it invokes the API's function with the schema-setup
     * event, which runs on a connection of its own (and closes it). The API handlers are
     * schema-managed: they expect it done. Run it before any other client of this database
     * connects.
     */
    const runSchemaSetupEvent = async () => {
        // The API's own connection: the event doesn't use it, so it never connects.
        const knex = createKnex();
        try {
            const handler = createAwsPgApiHandler({
                extensions: () => postgresModules,
                knex,
                createSetupKnex: createKnex
            });
            return await handler({ [SQL_SCHEMA_SETUP_EVENT_IDENTIFIER]: {} });
        } finally {
            await knex.destroy();
        }
    };

    const stop = async () => {
        await socketServer.stop();
        await db.close();
    };

    return { env, createKnex, runSchemaSetupEvent, stop };
};
