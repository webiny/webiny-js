import { describe, expect, it } from "vitest";
import { readPgConnectionEnv } from "~/readPgConnectionEnv.js";

describe("readPgConnectionEnv", () => {
    it("reads nothing from an empty env", () => {
        expect(readPgConnectionEnv({})).toEqual({
            connection: {},
            poolMax: undefined,
            retryMs: undefined
        });
    });

    it("reads the WEBINY_PG_* settings", () => {
        const env = readPgConnectionEnv({
            WEBINY_PG_HOST: "db.local",
            WEBINY_PG_PORT: "6543",
            WEBINY_PG_USER: "webiny",
            WEBINY_PG_PASSWORD: "secret",
            WEBINY_PG_DATABASE: "webiny_db",
            WEBINY_PG_SSL: "true",
            WEBINY_PG_APPLICATION_NAME: "api",
            WEBINY_PG_CONNECTION_TIMEOUT_MILLIS: "5000",
            WEBINY_PG_STATEMENT_TIMEOUT: "30000",
            WEBINY_PG_KEEP_ALIVE: "false",
            WEBINY_PG_POOL_MAX: "1",
            WEBINY_PG_RETRY_MS: "0"
        });

        expect(env).toEqual({
            connection: {
                host: "db.local",
                port: 6543,
                user: "webiny",
                password: "secret",
                database: "webiny_db",
                ssl: true,
                application_name: "api",
                connectionTimeoutMillis: 5000,
                statement_timeout: 30000,
                keepAlive: false
            },
            poolMax: 1,
            retryMs: 0
        });
    });

    it("builds TLS options when a certificate setting is present, instead of WEBINY_PG_SSL", () => {
        const env = readPgConnectionEnv({
            WEBINY_PG_SSL: "true",
            WEBINY_PG_SSL_REJECT_UNAUTHORIZED: "false"
        });

        expect(env.connection.ssl).toEqual({ rejectUnauthorized: false });
    });

    it("ignores numbers that aren't numbers", () => {
        const env = readPgConnectionEnv({ WEBINY_PG_PORT: "abc", WEBINY_PG_POOL_MAX: "x" });

        expect(env.connection.port).toBeUndefined();
        expect(env.poolMax).toBeUndefined();
    });
});
