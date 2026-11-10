import knexLib, { type Knex } from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { HeadlessCmsPgExtension } from "@webiny/api-headless-cms-pg";
import { AcoPgExtension } from "@webiny/api-aco-pg";
import { createAwsPgMigrateHandler } from "~/index.js";

/**
 * The Postgres modules a project adds with `<HeadlessCmsPg />` and `<AcoPg />`, as they land in its
 * `extensions.ts`: every API and migrate handler of a Postgres project gets them.
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
     * Sets the schema up as a deploy does, with the migrate handler on a connection of its own (which
     * it closes). The API handlers are schema-managed: they expect it done. Run it before any other
     * client of this database connects.
     */
    const setupSchema = async () => {
        await createAwsPgMigrateHandler({ extensions: () => postgresModules, createKnex })();
    };

    const stop = async () => {
        await socketServer.stop();
        await db.close();
    };

    return { env, createKnex, setupSchema, stop };
};
