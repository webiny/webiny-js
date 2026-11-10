import { createAbstraction } from "@webiny/feature/api";

export interface ISqlSchemaSetup {
    /**
     * What the step sets up, as a short id (`core`, `websockets`, `cms`, `aco`). The storage
     * reports the steps it ran by these names, and can check that a module it needs registered its
     * step.
     */
    readonly name: string;
    /**
     * Creates the step's tables, indexes and functions that don't exist yet, whatever the
     * schema-managed setting. Only adds; never alters or drops.
     */
    setup(): Promise<void>;
}

/**
 * One step of the storage's schema setup. Every part that owns tables registers its own step:
 * the storage registers its own (core, audit logs, websockets), and a module registered through the
 * project's extensions (the Postgres CMS, the folder catalog) registers its own. The storage's
 * `setupSchema()` runs every step it finds, so it doesn't need to know which modules exist.
 */
export const SqlSchemaSetup = createAbstraction<ISqlSchemaSetup>("Db/Sql/SchemaSetup");

export namespace SqlSchemaSetup {
    export type Interface = ISqlSchemaSetup;
}
