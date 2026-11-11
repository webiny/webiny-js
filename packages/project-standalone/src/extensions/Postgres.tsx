import React from "react";
import { z } from "zod";
import { BuildParam, defineExtension, EnvVar } from "@webiny/project/extensions/index.js";

const sslObjectSchema = z.object({
    rejectUnauthorized: z.boolean().optional().describe("Reject unverified SSL certificates."),
    ca: z.string().optional().describe("Path to SSL CA certificate file."),
    key: z.string().optional().describe("Path to SSL client key file."),
    cert: z.string().optional().describe("Path to SSL client certificate file.")
});

type SslObject = z.infer<typeof sslObjectSchema>;

/*
 * Settings of the Postgres-native CMS storage, passed to the API as build params. The Postgres API
 * handler reads them at startup (`readPgStorageSettings` in @webiny/api-headless-cms-pg) and passes
 * them to the storage. Each one is optional; unset, the storage's default applies.
 */
const cmsStorageSchema = z.object({
    indexMode: z
        .enum(["lean", "indexed"])
        .optional()
        .describe(
            'Index mode of new models: "lean" (rows unindexed until a model grows) or "indexed" (default).'
        ),
    indexModeTtlMs: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe(
            "Milliseconds a process may use a cached index mode for queries. Default: 30000."
        ),
    estimateTtlMs: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe("Milliseconds a row estimate is cached; 0 turns the cache off. Default: 60000."),
    fieldBudget: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe("Indexed columns a single model's own fields may use. Default: 50."),
    countCap: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("A list's total is exact up to this many matches. Default: 10000."),
    slotIndexes: z
        .boolean()
        .optional()
        .describe("false skips the per-column sort indexes (test runs). Default: true."),
    bitmapHints: z
        .boolean()
        .optional()
        .describe(
            "false leaves the planner settings alone when collecting matches (behind RDS Proxy). Default: true."
        ),
    sharedTables: z
        .boolean()
        .optional()
        .describe("true: all tenants share one table set. Default: false.")
});

type CmsStorageSettings = z.infer<typeof cmsStorageSchema>;

const CMS_STORAGE_PARAMS: Record<keyof CmsStorageSettings, string> = {
    indexMode: "PgIndexMode",
    indexModeTtlMs: "PgIndexModeTtlMs",
    estimateTtlMs: "PgEstimateTtlMs",
    fieldBudget: "PgFieldBudget",
    countCap: "PgCountCap",
    slotIndexes: "PgSlotIndexes",
    bitmapHints: "PgBitmapHints",
    sharedTables: "CmsSharedTables"
};

const CmsStorageBuildParams = ({ settings }: { settings: CmsStorageSettings | undefined }) => {
    if (!settings) {
        return null;
    }
    return (
        <>
            {(Object.keys(CMS_STORAGE_PARAMS) as (keyof CmsStorageSettings)[]).map(key => {
                const value = settings[key];
                if (value === undefined) {
                    return null;
                }
                return <BuildParam key={key} paramName={CMS_STORAGE_PARAMS[key]} value={value} />;
            })}
        </>
    );
};

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
    description: "Configure the standalone hosting type's Postgres database connection.",
    paramsSchema: z.object({
        host: z.string().describe("Postgres server hostname."),
        port: z.number().describe("Postgres server port."),
        user: z.string().describe("Postgres user."),
        password: z.string().describe("Postgres password."),
        database: z.string().describe("Postgres database name."),
        storage: z
            .enum(["pg", "sql"])
            .optional()
            .describe(
                'How content is stored: "pg" (default) is the Postgres-native storage; "sql" is the generic SQL storage. Chosen once per project: switching does not move existing data.'
            ),
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
            .describe("Milliseconds before first TCP keep-alive probe."),
        retryMs: z
            .number()
            .optional()
            .describe(
                "Milliseconds to retry a read or transaction that lost its connection (failover, restart). 0 turns retries off. Default: 15000."
            ),
        cmsStorage: cmsStorageSchema
            .optional()
            .describe('Settings of the Postgres-native CMS storage (storage: "pg").')
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
                <OptionalEnvVar
                    varName="WEBINY_PG_RETRY_MS"
                    value={optionalString(props.retryMs)}
                />
                <CmsStorageBuildParams settings={props.cmsStorage} />
            </>
        );
    }
});
