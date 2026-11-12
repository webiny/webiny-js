import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/event-handler-core";
import type { IServiceManifest } from "@webiny/api-core/features/serviceDiscovery/index.js";

export const SQL_SCHEMA_SETUP_EVENT_IDENTIFIER = "WebinySqlSchemaSetup";

export interface ISqlSchemaSetupEventPayload {
    /**
     * Service manifests to store for service discovery. Each replaces the stored manifest of the
     * same name; manifests not passed are left as they are.
     */
    serviceManifests?: IServiceManifest[];
}

/**
 * The deploy-time setup of the API on Postgres, invoked by the deployment (not by API traffic) on
 * the API's own function, so it gets the same extensions as every request:
 * `{ "WebinySqlSchemaSetup": { "serviceManifests": [...] } }`.
 */
export interface ISqlSchemaSetupEvent {
    [SQL_SCHEMA_SETUP_EVENT_IDENTIFIER]: ISqlSchemaSetupEventPayload;
}

export interface ISqlSchemaSetupResult {
    ok: true;
    /** What the setup did, one line per step. */
    done: string[];
}

export interface ISqlSchemaSetupEventHandler extends IEventHandler<
    ISqlSchemaSetupEvent,
    ISqlSchemaSetupResult
> {}

export const SqlSchemaSetupEventHandler = createAbstraction<ISqlSchemaSetupEventHandler>(
    "Db/Sql/SchemaSetupEventHandler"
);

export namespace SqlSchemaSetupEventHandler {
    export type Interface = ISqlSchemaSetupEventHandler;
}

export interface ISqlSchemaSetupConnection {
    /** Opens the connection the setup runs on. The handler closes it when it's done. */
    open(): Knex;
}

/**
 * The connection the schema setup runs on. On Lambda, schema changes go to the cluster's writer
 * (`WEBINY_PG_WRITER_HOST`, else `WEBINY_PG_HOST`), not through the RDS Proxy the API uses.
 */
export const SqlSchemaSetupConnection = createAbstraction<ISqlSchemaSetupConnection>(
    "Db/Sql/SchemaSetupConnection"
);

export namespace SqlSchemaSetupConnection {
    export type Interface = ISqlSchemaSetupConnection;
}

export interface SqlSchemaSetupServiceParams {
    /** Service manifests to store for service discovery; none leaves the stored ones as they are. */
    serviceManifests: IServiceManifest[];
}

export interface ISqlSchemaSetupService {
    /**
     * Sets the API up on Postgres, on the setup's own connection (`SqlSchemaSetupConnection`):
     * creates its tables, sets the database user's `idle_session_timeout` and stores the service
     * manifests. Every step is idempotent. Returns what it did, one line per step; throws when a
     * step fails.
     */
    setup(params: SqlSchemaSetupServiceParams): Promise<string[]>;
}

/**
 * The deploy-time setup of the API on Postgres. The schema-setup event handler delegates to it;
 * a project can decorate or replace it like any other implementation.
 */
export const SqlSchemaSetupService = createAbstraction<ISqlSchemaSetupService>(
    "Db/Sql/SchemaSetupService"
);

export namespace SqlSchemaSetupService {
    export type Interface = ISqlSchemaSetupService;
    export type Params = SqlSchemaSetupServiceParams;
}
