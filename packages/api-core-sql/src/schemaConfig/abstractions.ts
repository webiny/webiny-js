import { createAbstraction } from "@webiny/feature/api";

export interface ISqlSchemaConfig {
    /**
     * Whether the schema was set up before the API took traffic (the storage's schema setup ran).
     * When it is, storage code never checks for or creates tables at runtime: no catalog queries
     * and no DDL on a cold start. When it isn't, each table is checked and created on first use.
     */
    isManaged(): boolean;
}

/**
 * How the SQL storage finds its tables, set by the storage that registers it. Optional for the
 * code that reads it: when it isn't registered, tables are checked and created on first use.
 */
export const SqlSchemaConfig = createAbstraction<ISqlSchemaConfig>("Db/Sql/SchemaConfig");

export namespace SqlSchemaConfig {
    export type Interface = ISqlSchemaConfig;
}
