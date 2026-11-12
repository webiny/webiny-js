import { afterEach, describe, expect, it, vi } from "vitest";
import type { Knex } from "knex";
import { createPgConnection } from "~/createPgConnection.js";

const PG_VARS = [
    "WEBINY_PG_HOST",
    "WEBINY_PG_PORT",
    "WEBINY_PG_USER",
    "WEBINY_PG_PASSWORD",
    "WEBINY_PG_DATABASE",
    "WEBINY_PG_CONNECTION_STRING"
];

/* The connection settings Knex was given (building a client doesn't connect). */
const connectionOf = (knex: Knex): Knex.PgConnectionConfig => {
    return (knex.client as { config: { connection: Knex.PgConnectionConfig } }).config.connection;
};

describe("createPgConnection", () => {
    const clients: Knex[] = [];

    const create = (...args: Parameters<typeof createPgConnection>): Knex => {
        const knex = createPgConnection(...args);
        clients.push(knex);
        return knex;
    };

    afterEach(async () => {
        vi.unstubAllEnvs();
        await Promise.all(clients.splice(0).map(knex => knex.destroy()));
    });

    const clearPgEnv = () => {
        for (const name of PG_VARS) {
            vi.stubEnv(name, undefined);
        }
    };

    it("accepts a connection string on its own", () => {
        clearPgEnv();
        vi.stubEnv("WEBINY_PG_CONNECTION_STRING", "postgres://u:p@db.local:5432/webiny");

        const knex = create();

        expect(connectionOf(knex).connectionString).toBe("postgres://u:p@db.local:5432/webiny");
    });

    it("validates after `options.connection` is applied", () => {
        clearPgEnv();

        const knex = create({
            connection: {
                host: "db.local",
                port: 5432,
                user: "u",
                password: "p",
                database: "webiny"
            }
        });

        expect(connectionOf(knex)).toMatchObject({ host: "db.local", database: "webiny" });
    });

    it("names the first missing setting when there's no connection string", () => {
        clearPgEnv();
        vi.stubEnv("WEBINY_PG_HOST", "db.local");

        expect(() => create()).toThrow("Postgres port is not set");
    });

    it("lets explicit options win over the env", () => {
        clearPgEnv();
        vi.stubEnv("WEBINY_PG_HOST", "env.local");
        vi.stubEnv("WEBINY_PG_PORT", "5432");
        vi.stubEnv("WEBINY_PG_USER", "u");
        vi.stubEnv("WEBINY_PG_PASSWORD", "p");
        vi.stubEnv("WEBINY_PG_DATABASE", "webiny");

        const knex = create({ host: "option.local", connection: { database: "other" } });

        expect(connectionOf(knex)).toMatchObject({ host: "option.local", database: "other" });
    });
});
