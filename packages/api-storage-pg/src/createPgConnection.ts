import knex, { type Knex } from "knex";
import { withPgConnectionRetry } from "@webiny/api-core-sql";
import { DEFAULT_PG_RETRY_MS, readPgConnectionEnv } from "./readPgConnectionEnv.js";
import { applyToPgConnectionString } from "./applyToPgConnectionString.js";

const definedOnly = <T extends Record<string, unknown>>(values: T): Partial<T> => {
    return Object.fromEntries(Object.entries(values).filter(([, value]) => !!value)) as Partial<T>;
};

const assertSet = (value: unknown, message: string): void => {
    if (!value) {
        throw new Error(message);
    }
};

export interface CreatePgConnectionOptions {
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
 * A Knex client for Postgres, for a long-running process (the standalone server): Postgres, PGlite
 * (`<Infra.Pglite>`) or Aurora from a server. Connection parameters are read from the `WEBINY_PG_*`
 * env vars `<Infra.Postgres>` sets, with explicit options taking precedence. A connection string
 * (`WEBINY_PG_CONNECTION_STRING` or `options.connection.connectionString`) is enough on its own:
 * node-postgres reads host, port, user, password and database from it. On AWS Lambda, use
 * `createLambdaPgConnection` (`@webiny/api-event-handler-aws-pg`) instead.
 */
export function createPgConnection(options: CreatePgConnectionOptions = {}): Knex {
    const env = readPgConnectionEnv();
    const explicitConnection = options.connection || {};
    // The connection parts the caller set: the options, then `options.connection`.
    const explicit = {
        ...definedOnly({
            host: options.host,
            port: options.port,
            user: options.user,
            password: options.password,
            database: options.database
        }),
        ...definedOnly({
            host: explicitConnection.host,
            port: explicitConnection.port,
            user: explicitConnection.user,
            // A password function can't go into a connection string.
            password:
                typeof explicitConnection.password === "string"
                    ? explicitConnection.password
                    : undefined,
            database: explicitConnection.database
        })
    };
    // Env first, then the explicit options, then `options.connection`: validated as Knex gets it.
    const connectionConfig: Knex.PgConnectionConfig = {
        ...env.connection,
        ...explicit,
        ...explicitConnection
    };
    // node-postgres reads a connection string over the separate parts, so the parts the caller set
    // go into the string too (the env's own parts don't: the string is the env's whole connection).
    if (connectionConfig.connectionString && Object.keys(explicit).length > 0) {
        connectionConfig.connectionString = applyToPgConnectionString(
            connectionConfig.connectionString,
            explicit
        );
    }

    // A connection string holds the whole connection; otherwise each part must be set.
    if (!connectionConfig.connectionString) {
        assertSet(
            connectionConfig.host,
            'Postgres host is not set. Configure via <Infra.Postgres host="..." /> in webiny.config.'
        );
        assertSet(
            connectionConfig.port,
            "Postgres port is not set. Configure via <Infra.Postgres port={...} /> in webiny.config."
        );
        assertSet(
            connectionConfig.user,
            'Postgres user is not set. Configure via <Infra.Postgres user="..." /> in webiny.config.'
        );
        assertSet(
            connectionConfig.password,
            'Postgres password is not set. Configure via <Infra.Postgres password="..." /> in webiny.config.'
        );
        assertSet(
            connectionConfig.database,
            'Postgres database is not set. Configure via <Infra.Postgres database="..." /> in webiny.config.'
        );
    }

    const poolMax = env.poolMax;

    const client = knex({
        client: "pg",
        connection: connectionConfig,
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
