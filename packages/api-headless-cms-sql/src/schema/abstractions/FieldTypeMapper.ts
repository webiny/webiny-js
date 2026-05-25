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
