import React from "react";
import { z } from "zod";
import { defineExtension, EnvVar } from "@webiny/project/extensions/index.js";

const sslObjectSchema = z.object({
    rejectUnauthorized: z.boolean().optional().describe("Reject unverified SSL certificates."),
    ca: z.string().optional().describe("Path to SSL CA certificate file."),
    key: z.string().optional().describe("Path to SSL client key file."),
    cert: z.string().optional().describe("Path to SSL client certificate file.")
});

type SslObject = z.infer<typeof sslObjectSchema>;

const optionalString = (value: string | number | boolean | undefined): string | undefined => {
    if (value === undefined) {
        return undefined;
    }
    return String(value);
};

interface OptionalEnvVarProps {
    varName: string;
    value: string | undefined;
}

const OptionalEnvVar = ({ varName, value }: OptionalEnvVarProps) => {
    if (value === undefined) {
        return null;
    }
    return <EnvVar varName={varName} value={value} />;
};

interface SslEnvVarsProps {
    ssl: boolean | SslObject | undefined;
}

const SslEnvVars = ({ ssl }: SslEnvVarsProps) => {
    if (ssl === undefined) {
        return null;
    } else if (ssl === true) {
        return <EnvVar varName="WEBINY_PG_SSL" value="true" />;
    } else if (ssl === false) {
        return <EnvVar varName="WEBINY_PG_SSL" value="false" />;
    }

    return (
        <>
            <OptionalEnvVar
                varName="WEBINY_PG_SSL_REJECT_UNAUTHORIZED"
                value={optionalString(ssl.rejectUnauthorized)}
            />
            <OptionalEnvVar varName="WEBINY_PG_SSL_CA" value={ssl.ca} />
            <OptionalEnvVar varName="WEBINY_PG_SSL_KEY" value={ssl.key} />
            <OptionalEnvVar varName="WEBINY_PG_SSL_CERT" value={ssl.cert} />
        </>
    );
};

export const Postgres = defineExtension({
    type: "Infra/Postgres",
    tags: { runtimeContext: "project" },
    description: "Configure the server hosting type's Postgres database connection.",
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
        parseInputDatesAsUTC: z
            .boolean()
            .optional()
            .describe("Parse input date values as UTC instead of local time."),
        options: z
            .string()
            .optional()
            .describe("Postgres connection options string (e.g. -c search_path=myschema)."),
        keepAlive: z.boolean().optional().describe("Enable TCP keep-alive."),
        keepAliveInitialDelayMillis: z
            .number()
            .optional()
            .describe("Milliseconds before first TCP keep-alive probe.")
    }),
    render: props => {
        return (
            <>
                <EnvVar varName="WEBINY_PG_HOST" value={props.host} />
                <EnvVar varName="WEBINY_PG_PORT" value={String(props.port)} />
                <EnvVar varName="WEBINY_PG_USER" value={props.user} />
                <EnvVar varName="WEBINY_PG_PASSWORD" value={props.password} />
                <EnvVar varName="WEBINY_PG_DATABASE" value={props.database} />
                <SslEnvVars ssl={props.ssl} />
                <OptionalEnvVar
                    varName="WEBINY_PG_CONNECTION_STRING"
                    value={props.connectionString}
                />
                <OptionalEnvVar
                    varName="WEBINY_PG_APPLICATION_NAME"
                    value={props.applicationName}
                />
                <OptionalEnvVar
                    varName="WEBINY_PG_CONNECTION_TIMEOUT_MILLIS"
                    value={optionalString(props.connectionTimeoutMillis)}
                />
                <OptionalEnvVar
                    varName="WEBINY_PG_STATEMENT_TIMEOUT"
                    value={optionalString(props.statementTimeout)}
                />
                <OptionalEnvVar
                    varName="WEBINY_PG_QUERY_TIMEOUT"
                    value={optionalString(props.queryTimeout)}
                />
                <OptionalEnvVar
                    varName="WEBINY_PG_IDLE_IN_TRANSACTION_SESSION_TIMEOUT"
                    value={optionalString(props.idleInTransactionSessionTimeout)}
                />
                <OptionalEnvVar
                    varName="WEBINY_PG_PARSE_INPUT_DATES_AS_UTC"
                    value={optionalString(props.parseInputDatesAsUTC)}
                />
                <OptionalEnvVar varName="WEBINY_PG_OPTIONS" value={props.options} />
                <OptionalEnvVar
                    varName="WEBINY_PG_KEEP_ALIVE"
                    value={optionalString(props.keepAlive)}
                />
                <OptionalEnvVar
                    varName="WEBINY_PG_KEEP_ALIVE_INITIAL_DELAY_MILLIS"
                    value={optionalString(props.keepAliveInitialDelayMillis)}
                />
            </>
        );
    }
});
