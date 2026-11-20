import { createAbstraction } from "@webiny/feature/api/index.js";

export interface IEntryTableManager {
    /**
     * Makes sure the entries table exists before an entry operation. Does nothing when the schema is
     * managed (`SqlSchemaConfig`): schema setup created it before the API took traffic.
     */
    ensureTable(): Promise<void>;
    /** Checks for the entries table and creates it when missing, managed or not (schema setup). */
    setup(): Promise<void>;
    getTableName(): string;
    reset(): void;
}

export const EntryTableManager = createAbstraction<IEntryTableManager>("Cms/Sql/EntryTableManager");

export namespace EntryTableManager {
    export type Interface = IEntryTableManager;
}
