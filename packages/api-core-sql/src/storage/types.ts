import type { Knex } from "knex";
import type { Container } from "@webiny/feature/api";
import type { SqlStorageExtensions } from "../schemaSetup/index.js";

/**
 * The SQL storage of the Webiny API, built from a connection (`createSqliteStorage`,
 * `createPgStorage`) and handed to a transport (the standalone server, AWS Lambda). It holds no
 * engine settings beyond its own; modules with settings (the Postgres CMS) come with the project's
 * extensions.
 */
export interface SqlStorage {
    /** The connection the storage runs on. A transport puts its own SQL storage (self-hosted auth) on it. */
    readonly knex: Knex;
    /** The prefix of every table the storage uses. */
    readonly tableNamePrefix?: string;
    /**
     * Registers the storage in the transport's root container, once per process. After a successful
     * `setupSchema()` (or with `schemaManaged: true`), it registers schema-managed: no part checks
     * for or creates tables at runtime.
     */
    register(container: Container): Promise<void>;
    /**
     * Creates every table, index and function the storage and the project's modules use, before the
     * API takes traffic. Applies the project's API extensions (`extensions`) the way a request does,
     * so it sets up exactly the modules the API runs. Only adds what's missing; safe to run on every
     * start or deploy. Returns the names of the steps it ran.
     */
    setupSchema(extensions?: SqlStorageExtensions): Promise<string[]>;
}
