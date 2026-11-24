import knexFactory, { type Knex } from "knex";
import { withPgConnectionRetry } from "@webiny/api-core-sql";
import {
    applyToPgConnectionString,
    DEFAULT_PG_RETRY_MS,
    pgConnectionStringPassword,
    readPgConnectionEnv
} from "@webiny/api-storage-pg";
import { forgetPgPassword, isPgPasswordStale, readPgPassword } from "./readPgPassword.js";
import { checkIdleConnections } from "./checkIdleConnections.js";

export interface CreateLambdaPgConnectionOptions {
    /** Overrides `WEBINY_PG_HOST` (the schema setup connects to the cluster's writer). */
    host?: string;
}

/** Fail a connect quickly (e.g. to a server that's failing over), so a retry can try again. */
const DEFAULT_CONNECTION_TIMEOUT_MS = 5_000;

/** The pool closes a connection idle this long. */
const POOL_IDLE_TIMEOUT_MS = 60_000;

/** A connection idle this long is checked before it's handed out (see `checkIdleConnections`). */
const CHECK_AFTER_IDLE_MS = 1_000;

/** How long that check waits for the server's reply. */
const CHECK_TIMEOUT_MS = 2_000;

/** How long a dropped connection's goodbye may take before its socket is closed outright. */
const CLOSE_TIMEOUT_MS = 1_000;

/* Postgres refused the login: invalid_password, invalid_authorization_specification. */
const LOGIN_REFUSED_CODES = new Set(["28P01", "28000"]);

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
 *   `NODE_EXTRA_CA_CERTS=/var/runtime/ca-cert.pem`. The web function's runtime has no such file, so
 *   its deploy ships the RDS CA bundle in its code and points `NODE_EXTRA_CA_CERTS` there.
 *   `WEBINY_PG_SSL_CA` and `WEBINY_PG_SSL_REJECT_UNAUTHORIZED` work as on the standalone server.
 * - `WEBINY_PG_POOL_MAX` (default 1): a plain Lambda environment serves one request at a time. The
 *   API's web function serves several at once, so its deploy sets a bigger pool
 *   (the `poolSize` of the cluster `<Infra.AuroraPostgres />` renders, default 16). Either way
 *   the pool opens connections only when requests need them (`min: 0`). A released connection stays open for the next request, and the
 *   pool closes it after 60 s idle (on checkout, if the environment was frozen meanwhile).
 *   A connection that sat idle is checked before it's handed out, since the environment may have
 *   been frozen while the server ended it (see `checkIdleConnections`). A connection the pool drops
 *   is closed within a second, even when nothing answers its goodbye.
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

    // A connection string with a password (in the URI or its query) needs no other password source.
    const connectionString = connection.connectionString;
    const passwordInString =
        !!connectionString && pgConnectionStringPassword(connectionString) !== "";

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
                // node-postgres reads the string over `host` and `password`, so they go into it.
                config.connectionString = applyToPgConnectionString(connectionString, {
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
            idleTimeoutMillis: POOL_IDLE_TIMEOUT_MS
        },
        acquireConnectionTimeout: 15_000
    });

    forgetPasswordOnRefusedLogin(knex);
    closeDroppedConnectionsWithin(knex, CLOSE_TIMEOUT_MS);
    checkIdleConnections(knex, {
        checkAfterIdleMs: CHECK_AFTER_IDLE_MS,
        checkTimeoutMs: CHECK_TIMEOUT_MS,
        maxIdleMs: POOL_IDLE_TIMEOUT_MS
    });

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

/*
 * The pool closes a connection it drops (idle too long, failed its check) with node-postgres's
 * `end()`: with no query running, it sends Terminate, half-closes the socket and waits for the
 * server to close its side. When the network path dropped the connection without a word, that never
 * comes, and the socket would stay open until TCP gives up, minutes later, next to the connection
 * that replaced it. So a close that hasn't finished within `timeoutMs` destroys the socket. A
 * server that answers still gets its goodbye.
 */
const closeDroppedConnectionsWithin = (knex: Knex, timeoutMs: number): void => {
    const client = knex.client as { destroyRawConnection(connection: object): Promise<unknown> };
    const destroyRawConnection = client.destroyRawConnection;
    client.destroyRawConnection = async function (this: unknown, connection: object) {
        const timer = setTimeout(() => {
            const pgClient = connection as { connection?: { stream?: { destroy(): void } } };
            pgClient.connection?.stream?.destroy();
        }, timeoutMs);
        try {
            return await destroyRawConnection.call(this, connection);
        } finally {
            clearTimeout(timer);
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
