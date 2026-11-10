import knexFactory, { type Knex } from "knex";
import { withPgConnectionRetry } from "@webiny/api-core-sql";
import { DEFAULT_PG_RETRY_MS, readPgConnectionEnv } from "@webiny/api-storage-pg";
import { readPgPassword } from "./readPgPassword.js";

export interface CreateLambdaPgConnectionOptions {
    /** Overrides `WEBINY_PG_HOST` (the migrate function connects to the cluster's writer). */
    host?: string;
}

/** Fail a connect quickly (e.g. to a server that's failing over), so a retry can try again. */
const DEFAULT_CONNECTION_TIMEOUT_MS = 5_000;

/**
 * A Knex client for Postgres in a Lambda execution environment. Settings come from the
 * `WEBINY_PG_*` env vars, as on the standalone server:
 * - `WEBINY_PG_HOST`, `_PORT` (default 5432), `_USER`, `_DATABASE`: the cluster or the RDS Proxy.
 * - the password: `WEBINY_PG_PASSWORD`, or the secret `WEBINY_PG_SECRET_ARN`, read once per
 *   environment on its first connection (a cold start that never queries never reads it).
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

    const knex = knexFactory({
        client: "pg",
        // A function: knex calls it when it opens a connection, so the password is read on the
        // first connection (and once per environment, see readPgPassword).
        connection: async (): Promise<Knex.PgConnectionConfig> => ({
            application_name: process.env.AWS_LAMBDA_FUNCTION_NAME || "webiny",
            keepAlive: true,
            connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT_MS,
            port: 5432,
            ...connection,
            host,
            password: await readPgPassword()
        }),
        pool: {
            min: 0,
            max: env.poolMax || 1,
            acquireTimeoutMillis: 15_000,
            idleTimeoutMillis: 60_000
        },
        acquireConnectionTimeout: 15_000
    });

    const retryMs = env.retryMs ?? DEFAULT_PG_RETRY_MS;
    if (retryMs > 0) {
        withPgConnectionRetry(knex, { maxRetryMs: retryMs });
    }
    return knex;
}

let instance: Knex | undefined;

/**
 * The execution environment's Knex client, created on first use and kept for every invocation
 * after it. The API's storage holds on to it.
 */
export function getLambdaPgKnex(): Knex {
    instance ??= createLambdaPgConnection();
    return instance;
}
