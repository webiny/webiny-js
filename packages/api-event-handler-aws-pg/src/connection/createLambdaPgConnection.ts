import knexFactory, { type Knex } from "knex";
import { withPgConnectionRetry } from "@webiny/api-core-sql";
import { DEFAULT_PG_RETRY_MS, readPgConnectionEnv } from "@webiny/api-storage-pg";
import { forgetPgPassword, isPgPasswordStale, readPgPassword } from "./readPgPassword.js";

export interface CreateLambdaPgConnectionOptions {
    /** Overrides `WEBINY_PG_HOST` (the schema setup connects to the cluster's writer). */
    host?: string;
}

/** Fail a connect quickly (e.g. to a server that's failing over), so a retry can try again. */
const DEFAULT_CONNECTION_TIMEOUT_MS = 5_000;

/* Postgres refused the login: invalid_password, invalid_authorization_specification. */
const LOGIN_REFUSED_CODES = new Set(["28P01", "28000"]);

/*
 * node-postgres reads a connection string over the separate settings, so a host or password that
 * must win over it goes into the string itself.
 */
const applyToConnectionString = (
    connectionString: string,
    values: { host?: string; password?: string }
): string => {
    const url = new URL(connectionString);
    if (values.host) {
        url.hostname = values.host;
    }
    if (values.password !== undefined) {
        url.password = encodeURIComponent(values.password);
    }
    return url.toString();
};

const passwordOf = (connectionString: string): string => {
    try {
        return new URL(connectionString).password;
    } catch {
        return "";
    }
};

/**
 * A Knex client for Postgres in a Lambda execution environment. Settings come from the
 * `WEBINY_PG_*` env vars, as on the standalone server:
 * - `WEBINY_PG_HOST`, `_PORT` (default 5432), `_USER`, `_DATABASE`: the cluster or the RDS Proxy.
 * - the password: `WEBINY_PG_PASSWORD`, or the secret `WEBINY_PG_SECRET_ARN`, read on the
 *   environment's first connection (a cold start that never queries never reads it), and again
 *   after 5 minutes or a refused login, so a rotated secret is picked up (see `readPgPassword`).
 * - `WEBINY_PG_CONNECTION_STRING` instead of the separate settings: its password is used when it has
 *   one; otherwise the password above goes into it. A `host` option replaces the string's host.
 * - `WEBINY_PG_SSL=true` connects over TLS and verifies the server's certificate. Amazon RDS
 *   certificates are signed by the RDS CA, which Lambda's Node.js runtime trusts only with
 *   `NODE_EXTRA_CA_CERTS=/var/runtime/ca-cert.pem`; `WEBINY_PG_SSL_CA` and
 *   `WEBINY_PG_SSL_REJECT_UNAUTHORIZED` work as on the standalone server.
 * - `WEBINY_PG_POOL_MAX` (default 1): an environment serves one request at a time, and keeps no
 *   connection open it doesn't use (`min: 0`).
 * - `WEBINY_PG_RETRY_MS` (default 15,000; 0 = off): reads and transactions that lose their
 *   connection run again on a new one (see `withPgConnectionRetry`).
 * - `WEBINY_PG_APPLICATION_NAME` (default: the function's name), `WEBINY_PG_CONNECTION_TIMEOUT_MILLIS`
 *   (default 5,000), keep-alive on unless `WEBINY_PG_KEEP_ALIVE=false`.
 */
export function createLambdaPgConnection(options: CreateLambdaPgConnectionOptions = {}): Knex {
    const env = readPgConnectionEnv();
    const connection = env.connection;

    const host = options.host || connection.host;
    if (!host && !connection.connectionString) {
        throw new Error("The Postgres host is not set: set WEBINY_PG_HOST.");
    }
    if (!connection.user && !connection.connectionString) {
        throw new Error("The Postgres user is not set: set WEBINY_PG_USER.");
    }
    if (!connection.database && !connection.connectionString) {
        throw new Error("The Postgres database is not set: set WEBINY_PG_DATABASE.");
    }

    // A connection string with a password needs no other password source.
    const connectionString = connection.connectionString;
    const passwordInString = !!connectionString && passwordOf(connectionString) !== "";

    const knex = knexFactory({
        client: "pg",
        // A function: knex calls it when it opens a connection, so the password is read on the
        // first connection. Until the password goes stale (see readPgPassword), knex keeps the
        // result for the connections after it.
        connection: async (): Promise<Knex.PgConnectionConfig> => {
            const password = passwordInString ? undefined : await readPgPassword();
            const config: Knex.PgConnectionConfig & { expirationChecker?: () => boolean } = {
                application_name: process.env.AWS_LAMBDA_FUNCTION_NAME || "webiny",
                keepAlive: true,
                connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT_MS,
                port: 5432,
                ...connection
            };
            if (connectionString) {
                config.connectionString = applyToConnectionString(connectionString, {
                    host: options.host,
                    password
                });
            } else {
                config.host = host;
                config.password = password;
            }
            if (!passwordInString) {
                config.expirationChecker = () => isPgPasswordStale();
            }
            return config;
        },
        pool: {
            min: 0,
            max: env.poolMax || 1,
            acquireTimeoutMillis: 15_000,
            idleTimeoutMillis: 60_000
        },
        acquireConnectionTimeout: 15_000
    });

    forgetPasswordOnRefusedLogin(knex);

    const retryMs = env.retryMs ?? DEFAULT_PG_RETRY_MS;
    if (retryMs > 0) {
        withPgConnectionRetry(knex, { maxRetryMs: retryMs });
    }
    return knex;
}

/*
 * A login the database refuses (the secret was rotated since its password was read) makes the next
 * connection read the secret again, instead of trying the old password until it goes stale.
 */
const forgetPasswordOnRefusedLogin = (knex: Knex): void => {
    const client = knex.client as { acquireRawConnection(): Promise<unknown> };
    const acquireRawConnection = client.acquireRawConnection;
    client.acquireRawConnection = async function (this: unknown) {
        try {
            return await acquireRawConnection.call(this);
        } catch (error) {
            const code = (error as { code?: unknown }).code;
            if (typeof code === "string" && LOGIN_REFUSED_CODES.has(code)) {
                forgetPgPassword();
            }
            throw error;
        }
    };
};

let instance: Knex | undefined;

/**
 * The execution environment's Knex client, created on first use and kept for every invocation
 * after it. The API's storage holds on to it.
 */
export function getLambdaPgKnex(): Knex {
    instance ??= createLambdaPgConnection();
    return instance;
}
