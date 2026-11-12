import { afterEach, describe, expect, it, vi } from "vitest";
import type { Knex } from "knex";
import { createRequire } from "node:module";
import { createPgConnection } from "~/createPgConnection.js";
import {
    applyToPgConnectionString,
    pgConnectionStringPassword
} from "~/applyToPgConnectionString.js";

/* The parser node-postgres itself uses (pg's own copy, not whichever one is hoisted). */
const requireFromPg = createRequire(createRequire(import.meta.url).resolve("pg"));
const { parse } = requireFromPg("pg-connection-string") as {
    parse(connectionString: string): Record<string, string | null | undefined>;
};

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

    // node-postgres reads a connection string over the separate settings.
    it("lets explicit options win over a connection string in the env", () => {
        clearPgEnv();
        vi.stubEnv(
            "WEBINY_PG_CONNECTION_STRING",
            "postgres://u:p@env.local:5432/webiny?host=query.local&sslmode=require"
        );

        const knex = create({ host: "option.local", connection: { database: "other" } });

        const parsed = parse(connectionOf(knex).connectionString as string);
        expect(parsed).toMatchObject({
            host: "option.local",
            database: "other",
            user: "u",
            password: "p",
            sslmode: "require"
        });
    });

    it("leaves the env's connection string as it is when no option is set", () => {
        clearPgEnv();
        vi.stubEnv("WEBINY_PG_CONNECTION_STRING", "postgres://u:p@env.local:5432/webiny?host=q");

        const knex = create();

        expect(connectionOf(knex).connectionString).toBe(
            "postgres://u:p@env.local:5432/webiny?host=q"
        );
    });
});

describe("applyToPgConnectionString", () => {
    it("writes each value into the string, over the query parameter of the same name", () => {
        const result = applyToPgConnectionString(
            "postgres://u:p@url.local:5432/db?host=q.local&port=6000&user=qu&password=qp&application_name=x",
            {
                host: "writer.local",
                port: 5433,
                user: "admin",
                password: "p@ss/word",
                database: "other"
            }
        );

        expect({ ...parse(result) }).toMatchObject({
            host: "writer.local",
            port: "5433",
            user: "admin",
            password: "p@ss/word",
            database: "other",
            application_name: "x"
        });
    });

    it("keeps the string's own values for those not set", () => {
        const result = applyToPgConnectionString("postgres://u:p@url.local:5432/db?host=q.local", {
            host: "",
            password: undefined
        });

        expect({ ...parse(result) }).toMatchObject({ host: "q.local", user: "u", password: "p" });
    });

    it("puts a Unix socket directory in the query", () => {
        const result = applyToPgConnectionString("postgres://u:p@url.local/db", {
            host: "/var/run/postgresql"
        });

        expect(parse(result).host).toBe("/var/run/postgresql");
    });

    it("writes into a string without a host, as node-postgres parses it", () => {
        const socket = applyToPgConnectionString("postgres://u:pw@/db?host=/var/run/postgresql", {
            database: "other",
            port: 5433
        });
        expect({ ...parse(socket) }).toMatchObject({
            host: "/var/run/postgresql",
            port: "5433",
            user: "u",
            password: "pw",
            database: "other"
        });

        const noAuthority = applyToPgConnectionString("postgres:///db", { user: "admin" });
        expect({ ...parse(noAuthority) }).toMatchObject({
            host: "",
            user: "admin",
            database: "db"
        });

        const hostSet = applyToPgConnectionString("postgres://u:pw@/db", { host: "writer.local" });
        expect({ ...parse(hostSet) }).toMatchObject({ host: "writer.local", password: "pw" });
    });

    it("writes into libpq's socket form", () => {
        const result = applyToPgConnectionString("/var/run/postgresql db", { user: "admin" });

        expect({ ...parse(result) }).toMatchObject({
            host: "/var/run/postgresql",
            user: "admin",
            database: "db"
        });
    });

    it("writes credentials into a string without a host or a database", () => {
        const socket = applyToPgConnectionString("/var/run/postgresql", {
            user: "admin",
            password: "pw"
        });
        expect({ ...parse(socket) }).toMatchObject({
            host: "/var/run/postgresql",
            user: "admin",
            password: "pw",
            database: null
        });

        const query = applyToPgConnectionString("postgres://?host=/tmp", { password: "pw" });
        expect({ ...parse(query) }).toMatchObject({ host: "/tmp", password: "pw", database: null });
    });

    it("keeps a password with a stray % as node-postgres reads it", () => {
        const result = applyToPgConnectionString("postgres://u:pa%ss@h/db", { database: "other" });

        expect({ ...parse(result) }).toMatchObject({ password: "pa%ss", database: "other" });
    });

    it("writes a database name node-postgres reads back as it is", () => {
        for (const database of ["a/b", "a&b+c=d", "50% off", "ü db", "a;b,c$d:e@f"]) {
            const result = applyToPgConnectionString("postgres://u:p@h/db", { database });
            expect(parse(result).database).toBe(database);
        }
        expect(() => applyToPgConnectionString("postgres://u:p@h/db", { database: "a#b" })).toThrow(
            /can't be written/
        );
    });

    it("returns a string node-postgres can't parse either as it is", () => {
        expect(applyToPgConnectionString("not a url", { database: "x" })).toBe("not a url");
    });
});

describe("pgConnectionStringPassword", () => {
    it("reads the password, as written, from the URI or, over it, from the query", () => {
        expect(pgConnectionStringPassword("postgres://u:p%40ss@h/db")).toBe("p%40ss"); // gitleaks:allow
        expect(pgConnectionStringPassword("postgres://u:pa%ss@h/db")).not.toBe("");
        expect(pgConnectionStringPassword("postgres://u:pw@/db?host=/tmp")).toBe("pw");
        expect(pgConnectionStringPassword("postgres://u@h/db?password=secret")).toBe("secret");
        expect(pgConnectionStringPassword("postgres://u:uri@h/db?password=query")).toBe("query");
        expect(pgConnectionStringPassword("postgres://u@h/db")).toBe("");
        expect(pgConnectionStringPassword("/var/run/postgresql db")).toBe("");
        expect(pgConnectionStringPassword("not a url")).toBe("");
    });
});
