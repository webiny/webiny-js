import fs from "node:fs";
import knex, { type Knex } from "knex";
import type { ConnectionOptions } from "node:tls";
import { toBoolean } from "@webiny/stdlib";

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
}

const envBool = (name: string): boolean | undefined => {
    return toBoolean(process.env[name]);
};

const envInt = (name: string): number | undefined => {
    const v = process.env[name];
    if (v === undefined) {
        return undefined;
    }
    const n = Number(v);
    return isNaN(n) ? undefined : n;
};

/**
 * Build a Knex client backed by a Postgres database. Connection parameters are read from
 * environment variables set by `<Infra.Postgres>` in webiny.config, with explicit options
 * taking precedence.
 */
export function createPostgresConnection(options: CreatePostgresConnectionOptions = {}): Knex {
    const host = options.host || process.env.WEBINY_PG_HOST;
    const port = options.port || envInt("WEBINY_PG_PORT");
    const user = options.user || process.env.WEBINY_PG_USER;
    const password = options.password || process.env.WEBINY_PG_PASSWORD;
    const database = options.database || process.env.WEBINY_PG_DATABASE;

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
        host,
        port,
        user,
        password,
        database
    };

    const connectionString = process.env.WEBINY_PG_CONNECTION_STRING;
    if (connectionString) {
        connectionConfig.connectionString = connectionString;
    }

    const sslCa = process.env.WEBINY_PG_SSL_CA;
    const sslKey = process.env.WEBINY_PG_SSL_KEY;
    const sslCert = process.env.WEBINY_PG_SSL_CERT;
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
        connectionConfig.ssl = sslConfig;
    } else {
        const ssl = envBool("WEBINY_PG_SSL");
        if (ssl !== undefined) {
            connectionConfig.ssl = ssl;
        }
    }

    const applicationName = process.env.WEBINY_PG_APPLICATION_NAME;
    if (applicationName) {
        connectionConfig.application_name = applicationName;
    }

    const connectionTimeoutMillis = envInt("WEBINY_PG_CONNECTION_TIMEOUT_MILLIS");
    if (connectionTimeoutMillis !== undefined) {
        connectionConfig.connectionTimeoutMillis = connectionTimeoutMillis;
    }

    const statementTimeout = envInt("WEBINY_PG_STATEMENT_TIMEOUT");
    if (statementTimeout !== undefined) {
        connectionConfig.statement_timeout = statementTimeout;
    }

    const queryTimeout = envInt("WEBINY_PG_QUERY_TIMEOUT");
    if (queryTimeout !== undefined) {
        connectionConfig.query_timeout = queryTimeout;
    }

    const idleInTransactionSessionTimeout = envInt("WEBINY_PG_IDLE_IN_TRANSACTION_SESSION_TIMEOUT");
    if (idleInTransactionSessionTimeout !== undefined) {
        connectionConfig.idle_in_transaction_session_timeout = idleInTransactionSessionTimeout;
    }

    const parseInputDatesAsUTC = envBool("WEBINY_PG_PARSE_INPUT_DATES_AS_UTC");
    if (parseInputDatesAsUTC !== undefined) {
        connectionConfig.parseInputDatesAsUTC = parseInputDatesAsUTC;
    }

    const pgOptions = process.env.WEBINY_PG_OPTIONS;
    if (pgOptions) {
        connectionConfig.options = pgOptions;
    }

    const keepAlive = envBool("WEBINY_PG_KEEP_ALIVE");
    if (keepAlive !== undefined) {
        connectionConfig.keepAlive = keepAlive;
    }

    const keepAliveInitialDelayMillis = envInt("WEBINY_PG_KEEP_ALIVE_INITIAL_DELAY_MILLIS");
    if (keepAliveInitialDelayMillis !== undefined) {
        connectionConfig.keepAliveInitialDelayMillis = keepAliveInitialDelayMillis;
    }

    return knex({
        client: "pg",
        connection: {
            ...connectionConfig,
            ...options.connection
        }
    });
}
