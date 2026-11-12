import type { Knex } from "knex";
import type { Container } from "@webiny/feature/api";

/**
 * The SQL storage of the Webiny API, built from a connection (`createSqliteStorage`,
 * `createPgStorage`) and handed to a transport (the standalone server, AWS Lambda). It holds no
 * engine settings beyond its own; modules with settings (the Postgres CMS) come with the project's
 * extensions.
 */
export interface SqlStorage {
    /** The connection the storage runs on. */
    readonly knex: Knex;
    /** The prefix of every table the storage uses. */
    readonly tableNamePrefix?: string;
    /**
     * Registers the storage in the transport's root container, once per process: the connection and
     * its settings (`SqlConnectionFeature`), a `RequestStorage` that registers the storages (core,
     * audit logs, websockets) in each request's container, and its `SqlSchemaSetupRunner`. The
     * transport runs the setup before the API takes traffic; once it ran, the storage is
     * schema-managed: no part checks for or creates tables at runtime.
     */
    register(container: Container): void;
}
