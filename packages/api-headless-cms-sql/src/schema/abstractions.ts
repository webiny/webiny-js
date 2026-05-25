import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { createAbstraction } from "@webiny/feature/api/index.js";

export type SqlColumnType =
    | "text"
    | "varchar"
    | "integer"
    | "bigint"
    | "float"
    | "boolean"
    | "timestamp"
    | "date"
    | "json"
    | "jsonb";

export interface IColumnDefinition {
    name: string;
    type: SqlColumnType;
    nullable?: boolean;
    primaryKey?: boolean;
    defaultValue?: string | number | boolean | null;
}

export interface IFieldTypeMapper {
    mapFieldType(fieldType: string, settings?: Record<string, unknown>): SqlColumnType;
}

export const FieldTypeMapper = createAbstraction<IFieldTypeMapper>("Cms/Sql/FieldTypeMapper");

export namespace FieldTypeMapper {
    export type Interface = IFieldTypeMapper;
}

export interface ISchemaRegistry {
    /* Check if a table has been verified this process. */
    isVerified(tableName: string): boolean;
    /* Mark a table as verified. */
    markVerified(tableName: string): void;
    /* Remove a table from the verified set. */
    removeVerified(tableName: string): void;
}

export const SchemaRegistry = createAbstraction<ISchemaRegistry>("Cms/Sql/SchemaRegistry");

export namespace SchemaRegistry {
    export type Interface = ISchemaRegistry;
}

export interface IGroupSchemaManager {
    ensure(tableName: string): Promise<void>;
}

export const GroupSchemaManager = createAbstraction<IGroupSchemaManager>(
    "Cms/Sql/GroupSchemaManager"
);

export namespace GroupSchemaManager {
    export type Interface = IGroupSchemaManager;
}

export interface IModelSchemaManager {
    ensure(tableName: string): Promise<void>;
}

export const ModelSchemaManager = createAbstraction<IModelSchemaManager>(
    "Cms/Sql/ModelSchemaManager"
);

export namespace ModelSchemaManager {
    export type Interface = IModelSchemaManager;
}

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
