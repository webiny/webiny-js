import type { Knex } from "knex";
import type { Container } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";

export interface ISqlSchemaSetup {
    /**
     * What the step sets up, as a short id (`core`, `websockets`, `cms`, `aco`). The runner reports
     * the steps it ran by these names, and can check that a module it needs registered its step.
     */
    readonly name: string;
    /**
     * Brings the step's tables, indexes and functions up to date, whatever the schema-managed
     * setting. Safe to run again: what already exists is kept. It never drops a table or a column,
     * but a step may migrate in place. The Postgres CMS, for one, adds columns
     * (`ALTER TABLE … ADD COLUMN IF NOT EXISTS`), changes column statistics, replaces its trigger
     * functions, replaces the old count triggers and rebuilds the count rows from the search table
     * once. The database user that runs setup needs the rights for that.
     */
    setup(): Promise<void>;
}

/**
 * One step of the schema setup. Every part that owns tables registers its own step in a request's
 * container: the storage's parts (core, audit logs, websockets), the transport's login storage, and
 * the modules registered through the project's extensions (the Postgres CMS, the folder catalog).
 * The setup runner runs every step it finds, so it doesn't need to know which modules exist.
 */
export const SqlSchemaSetup = createAbstraction<ISqlSchemaSetup>("Db/Sql/SchemaSetup");

export namespace SqlSchemaSetup {
    export type Interface = ISqlSchemaSetup;
}

/**
 * What a request registers, as the transport builds every request's container: its storages (every
 * `RequestStorage`), the API's features and the project's extensions. The schema setup builds its
 * container with it, so it sets up exactly the tables the API uses, with their settings.
 */
export interface ISqlSchemaSetupRequest {
    register(container: Container): Promise<void>;
}

export interface SqlSchemaSetupRunParams {
    /** Registers a request's parts in the setup's container. */
    request: ISqlSchemaSetupRequest;
    /**
     * The connection to set the schema up on. Defaults to the storage's. The caller closes it.
     * On Lambda, setup goes to the database's writer, not through the proxy the API uses.
     */
    knex?: Knex;
}

export interface ISqlSchemaSetupRunner {
    /**
     * Creates every table, index and function the API uses: opens the setup's transaction (on
     * Postgres, behind an advisory lock), builds a container on it the way a request's is built,
     * and runs every `SqlSchemaSetup` step in it. Keeps what exists, and is safe to run on every
     * start or deploy (see `ISqlSchemaSetup.setup` for what a step may migrate). Afterwards the storage is schema-managed. Returns the names of the steps it
     * ran.
     */
    run(params: SqlSchemaSetupRunParams): Promise<string[]>;
}

/**
 * Runs the schema setup of the SQL storage. Each storage registers its implementation in the root:
 * it knows how its engine runs DDL safely (a transaction behind an advisory lock on Postgres, a plain
 * transaction on SQLite) and which modules it can't run without. The transport runs it before the
 * API takes traffic: the standalone server at start, the Lambda API on its schema-setup event.
 */
export const SqlSchemaSetupRunner = createAbstraction<ISqlSchemaSetupRunner>(
    "Db/Sql/SchemaSetupRunner"
);

export namespace SqlSchemaSetupRunner {
    export type Interface = ISqlSchemaSetupRunner;
    export type Request = ISqlSchemaSetupRequest;
    export type RunParams = SqlSchemaSetupRunParams;
}
