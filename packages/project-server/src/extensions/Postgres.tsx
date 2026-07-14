import React from "react";
import { z } from "zod";
import { defineExtension, EnvVar } from "@webiny/project/extensions/index.js";

const sslObjectSchema = z.object({
    rejectUnauthorized: z.boolean().optional().describe("Reject unverified SSL certificates."),
    ca: z.string().optional().describe("Path to SSL CA certificate file."),
    key: z.string().optional().describe("Path to SSL client key file."),
    cert: z.string().optional().describe("Path to SSL client certificate file.")
});

export const Postgres = defineExtension({
    type: "Infra/Postgres",
    tags: { runtimeContext: "project" },
    description: "Configure the server flavour's Postgres database connection.",
    paramsSchema: z.object({
        host: z.string().describe("Postgres server hostname."),
        port: z.number().describe("Postgres server port."),
        user: z.string().describe("Postgres user."),
        password: z.string().describe("Postgres password."),
        database: z.string().describe("Postgres database name."),
        ssl: z
            .union([z.boolean(), sslObjectSchema])
            .optional()
            .describe("SSL config: true to enable, or object with certificate file paths."),
        connectionString: z
            .string()
            .optional()
            .describe("Full connection string (overrides host/port/user/password/database)."),
        applicationName: z.string().optional().describe("Application name for pg_stat_activity."),
        connectionTimeoutMillis: z
            .number()
            .optional()
            .describe("Milliseconds to wait for connection."),
        statementTimeout: z
            .number()
            .optional()
            .describe("Milliseconds before a statement times out."),
        queryTimeout: z.number().optional().describe("Milliseconds before a query times out."),
        idleInTransactionSessionTimeout: z
            .number()
            .optional()
            .describe("Milliseconds before an idle-in-transaction session times out."),
        keepAlive: z.boolean().optional().describe("Enable TCP keep-alive."),
        keepAliveInitialDelayMillis: z
            .number()
            .optional()
            .describe("Milliseconds before first TCP keep-alive probe.")
    }),
    render: props => {
        const ssl = props.ssl;
        const sslIsObject = typeof ssl === "object" && ssl !== null;

        return (
            <>
                <EnvVar varName="WEBINY_PG_HOST" value={props.host} />
                <EnvVar varName="WEBINY_PG_PORT" value={String(props.port)} />
                <EnvVar varName="WEBINY_PG_USER" value={props.user} />
                <EnvVar varName="WEBINY_PG_PASSWORD" value={props.password} />
                <EnvVar varName="WEBINY_PG_DATABASE" value={props.database} />
                {ssl === true && <EnvVar varName="WEBINY_PG_SSL" value="true" />}
                {sslIsObject && ssl.rejectUnauthorized !== undefined && (
                    <EnvVar
                        varName="WEBINY_PG_SSL_REJECT_UNAUTHORIZED"
                        value={String(ssl.rejectUnauthorized)}
                    />
                )}
                {sslIsObject && ssl.ca && <EnvVar varName="WEBINY_PG_SSL_CA" value={ssl.ca} />}
                {sslIsObject && ssl.key && <EnvVar varName="WEBINY_PG_SSL_KEY" value={ssl.key} />}
                {sslIsObject && ssl.cert && (
                    <EnvVar varName="WEBINY_PG_SSL_CERT" value={ssl.cert} />
                )}
                {props.connectionString && (
                    <EnvVar varName="WEBINY_PG_CONNECTION_STRING" value={props.connectionString} />
                )}
                {props.applicationName && (
                    <EnvVar varName="WEBINY_PG_APPLICATION_NAME" value={props.applicationName} />
                )}
                {props.connectionTimeoutMillis !== undefined && (
                    <EnvVar
                        varName="WEBINY_PG_CONNECTION_TIMEOUT_MILLIS"
                        value={String(props.connectionTimeoutMillis)}
                    />
                )}
                {props.statementTimeout !== undefined && (
                    <EnvVar
                        varName="WEBINY_PG_STATEMENT_TIMEOUT"
                        value={String(props.statementTimeout)}
                    />
                )}
                {props.queryTimeout !== undefined && (
                    <EnvVar varName="WEBINY_PG_QUERY_TIMEOUT" value={String(props.queryTimeout)} />
                )}
                {props.idleInTransactionSessionTimeout !== undefined && (
                    <EnvVar
                        varName="WEBINY_PG_IDLE_IN_TRANSACTION_SESSION_TIMEOUT"
                        value={String(props.idleInTransactionSessionTimeout)}
                    />
                )}
                {props.keepAlive !== undefined && (
                    <EnvVar varName="WEBINY_PG_KEEP_ALIVE" value={String(props.keepAlive)} />
                )}
                {props.keepAliveInitialDelayMillis !== undefined && (
                    <EnvVar
                        varName="WEBINY_PG_KEEP_ALIVE_INITIAL_DELAY_MILLIS"
                        value={String(props.keepAliveInitialDelayMillis)}
                    />
                )}
            </>
        );
    }
});
