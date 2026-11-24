import { createAbstraction } from "@webiny/feature/api/index.js";

export interface IPgTables {
    entries: string;
    search: string;
    scopes: string;
    /* Counts of each text-list value per scope, view and slot (see valueCounts.ts). */
    values: string;
    /* Changes to those counts not yet folded in, appended by triggers on the search table. */
    valueDeltas: string;
}

export interface IPgSchema {
    /**
     * Creates the pg tables (plus their functions, triggers and indexes) once per process; a no-op
     * when the schema is managed (`SqlSchemaConfig`).
     */
    ensure(): Promise<void>;
    /**
     * Creates the tables, functions, triggers and indexes, whatever the mode. The storage's schema
     * setup calls this; once the schema is managed (`SqlSchemaConfig`), `ensure()` does nothing.
     */
    setup(): Promise<void>;
    getTables(): IPgTables;
    reset(): void;
}

export const PgSchema = createAbstraction<IPgSchema>("Cms/Pg/Schema");

export namespace PgSchema {
    export type Interface = IPgSchema;
    export type Tables = IPgTables;
}
