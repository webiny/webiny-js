import fs from "node:fs";
import type { Knex } from "knex";
import type { ConnectionOptions } from "node:tls";
import { toBoolean } from "@webiny/stdlib";

type Env = Record<string, string | undefined>;

/** How long a read or transaction that lost its connection is retried by default, in milliseconds. */
export const DEFAULT_PG_RETRY_MS = 15_000;

export interface PgConnectionEnv {
    /**
     * The connection settings that are set in the env. Each is left out when its variable isn't set,
     * so a caller's own defaults apply.
     */
    connection: Knex.PgConnectionConfig;
    /** Pool size (`WEBINY_PG_POOL_MAX`). */
    poolMax?: number;
    /**
     * How long to retry a read or transaction that lost its connection (`WEBINY_PG_RETRY_MS`);
     * 0 turns retries off.
     */
    retryMs?: number;
}

/**
 * The Postgres connection settings in the env, under the `WEBINY_PG_*` names `<Infra.Postgres>`
 * sets. Shared by every handler that connects to Postgres (the standalone server and Lambda), so
 * they read the same variables the same way.
 */
export function readPgConnectionEnv(env: Env = process.env): PgConnectionEnv {
    const envBool = (name: string): boolean | undefined => {
        const value = env[name];
        // Only convert when the var is actually set — an unset var must stay `undefined`, not become
        // `false`. Callers rely on the `undefined` distinction (e.g. the SSL config is only applied
        // when a WEBINY_PG_SSL* var is explicitly present); returning `false` for unset would always
        // trigger it.
        return value === undefined ? undefined : toBoolean(value);
    };

    const envInt = (name: string): number | undefined => {
        const value = env[name];
        if (value === undefined) {
            return undefined;
        }
        const n = Number(value);
        return isNaN(n) ? undefined : n;
    };

    const connection: Knex.PgConnectionConfig = {};

    const host = env.WEBINY_PG_HOST;
    if (host) {
        connection.host = host;
    }
    const port = envInt("WEBINY_PG_PORT");
    if (port) {
        connection.port = port;
    }
    const user = env.WEBINY_PG_USER;
    if (user) {
        connection.user = user;
    }
    const password = env.WEBINY_PG_PASSWORD;
    if (password) {
        connection.password = password;
    }
    const database = env.WEBINY_PG_DATABASE;
    if (database) {
        connection.database = database;
    }

    const connectionString = env.WEBINY_PG_CONNECTION_STRING;
    if (connectionString) {
        connection.connectionString = connectionString;
    }

    const sslCa = env.WEBINY_PG_SSL_CA;
    const sslKey = env.WEBINY_PG_SSL_KEY;
    const sslCert = env.WEBINY_PG_SSL_CERT;
    const sslRejectUnauthorized = envBool("WEBINY_PG_SSL_REJECT_UNAUTHORIZED");

    if (sslCa || sslKey || sslCert || sslRejectUnauthorized !== undefined) {
        const sslConfig: ConnectionOptions = {};
        if (sslCa) {
            sslConfig.ca = fs.readFileSync(sslCa, "utf8");
        }
        if (sslKey) {
            sslConfig.key = fs.readFileSync(sslKey, "utf8");
        }
        if (sslCert) {
            sslConfig.cert = fs.readFileSync(sslCert, "utf8");
        }
        if (sslRejectUnauthorized !== undefined) {
            sslConfig.rejectUnauthorized = sslRejectUnauthorized;
        }
        connection.ssl = sslConfig;
    } else {
        const ssl = envBool("WEBINY_PG_SSL");
        if (ssl !== undefined) {
            connection.ssl = ssl;
        }
    }

    const applicationName = env.WEBINY_PG_APPLICATION_NAME;
    if (applicationName) {
        connection.application_name = applicationName;
    }

    const connectionTimeoutMillis = envInt("WEBINY_PG_CONNECTION_TIMEOUT_MILLIS");
    if (connectionTimeoutMillis !== undefined) {
        connection.connectionTimeoutMillis = connectionTimeoutMillis;
    }

    const statementTimeout = envInt("WEBINY_PG_STATEMENT_TIMEOUT");
    if (statementTimeout !== undefined) {
        connection.statement_timeout = statementTimeout;
    }

    const queryTimeout = envInt("WEBINY_PG_QUERY_TIMEOUT");
    if (queryTimeout !== undefined) {
        connection.query_timeout = queryTimeout;
    }

    const idleInTransactionSessionTimeout = envInt("WEBINY_PG_IDLE_IN_TRANSACTION_SESSION_TIMEOUT");
    if (idleInTransactionSessionTimeout !== undefined) {
        connection.idle_in_transaction_session_timeout = idleInTransactionSessionTimeout;
    }

    const parseInputDatesAsUTC = envBool("WEBINY_PG_PARSE_INPUT_DATES_AS_UTC");
    if (parseInputDatesAsUTC !== undefined) {
        connection.parseInputDatesAsUTC = parseInputDatesAsUTC;
    }

    const pgOptions = env.WEBINY_PG_OPTIONS;
    if (pgOptions) {
        connection.options = pgOptions;
    }

    const keepAlive = envBool("WEBINY_PG_KEEP_ALIVE");
    if (keepAlive !== undefined) {
        connection.keepAlive = keepAlive;
    }

    const keepAliveInitialDelayMillis = envInt("WEBINY_PG_KEEP_ALIVE_INITIAL_DELAY_MILLIS");
    if (keepAliveInitialDelayMillis !== undefined) {
        connection.keepAliveInitialDelayMillis = keepAliveInitialDelayMillis;
    }

    return {
        connection,
        // A database that serves one connection at a time (`<Infra.Pglite>`) sets the pool size.
        poolMax: envInt("WEBINY_PG_POOL_MAX"),
        retryMs: envInt("WEBINY_PG_RETRY_MS")
    };
}
