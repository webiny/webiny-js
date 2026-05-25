import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { createAbstraction } from "@webiny/feature/api/index.js";

export interface IStoredTableSchema {
    tableName: string;
    modelId: string;
    fields: string;
    syncedOn: string;
}

export interface IEntrySchemaManager {
    /* Sync entry table with model fields. Adds missing columns, never drops. */
    sync(tableName: string, modelId: string, fields: CmsModelField[]): Promise<void>;
    /* Drop an entry table and remove its stored schema. */
    drop(tableName: string): Promise<void>;
}

export const EntrySchemaManager = createAbstraction<IEntrySchemaManager>(
    "Cms/Sql/EntrySchemaManager"
);

export namespace EntrySchemaManager {
    export type Interface = IEntrySchemaManager;
}
