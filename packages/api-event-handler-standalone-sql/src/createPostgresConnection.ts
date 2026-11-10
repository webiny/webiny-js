import knex, { type Knex } from "knex";
import { withPgConnectionRetry } from "@webiny/api-core-sql";
// By module path: the package's index brings the Postgres storage, which a generic SQL handler on
// Postgres doesn't use.
import {
    DEFAULT_PG_RETRY_MS,
    readPgConnectionEnv
} from "@webiny/api-storage-pg/readPgConnectionEnv.js";

export interface CreatePostgresConnectionOptions {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    /**
     * Optional additional Knex connection config (SSL, pool size, etc.).
     * Overrides values from env vars when both are set.
     */
    connection?: Partial<Knex.PgConnectionConfig>;
    /**
     * How long to retry a read or transaction that lost its connection (failover, restart), in
     * milliseconds; 0 turns retries off. Default: `WEBINY_PG_RETRY_MS`, else 15,000.
     */
    retryMs?: number;
}

/**
 * Build a Knex client backed by a Postgres database. Connection parameters are read from
 * environment variables set by `<Infra.Postgres>` in webiny.config, with explicit options
 * taking precedence.
 */
export function createPostgresConnection(options: CreatePostgresConnectionOptions = {}): Knex {
    const env = readPgConnectionEnv();
    const host = options.host || env.connection.host;
    const port = options.port || env.connection.port;
    const user = options.user || env.connection.user;
    const password = options.password || env.connection.password;
    const database = options.database || env.connection.database;

    if (!host) {
        throw new Error(
            'Postgres host is not set. Configure via <Infra.Postgres host="..." /> in webiny.config.'
        );
    }
    if (!port) {
        throw new Error(
            "Postgres port is not set. Configure via <Infra.Postgres port={...} /> in webiny.config."
        );
    }
    if (!user) {
        throw new Error(
            'Postgres user is not set. Configure via <Infra.Postgres user="..." /> in webiny.config.'
        );
    }
    if (!password) {
        throw new Error(
            'Postgres password is not set. Configure via <Infra.Postgres password="..." /> in webiny.config.'
        );
    }
    if (!database) {
        throw new Error(
            'Postgres database is not set. Configure via <Infra.Postgres database="..." /> in webiny.config.'
        );
    }

    const connectionConfig: Knex.PgConnectionConfig = {
        ...env.connection,
        host,
        port,
        user,
        password,
        database
    };

    const poolMax = env.poolMax;

    const client = knex({
        client: "pg",
        connection: {
            ...connectionConfig,
            ...options.connection
        },
        // knex's default minimum (2) must not exceed the maximum.
        ...(poolMax !== undefined ? { pool: { min: Math.min(2, poolMax), max: poolMax } } : {})
    });

    // Reads and transactions that lose their connection run again on a new one (see
    // withPgConnectionRetry); writes outside a transaction are not retried.
    const retryMs = options.retryMs ?? env.retryMs ?? DEFAULT_PG_RETRY_MS;
    if (retryMs > 0) {
        withPgConnectionRetry(client, { maxRetryMs: retryMs });
    }
    return client;
}
