import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api/index.js";

export interface IModelFieldParent {
    fieldId: string;
    storageId: string;
}

export interface IModelField {
    fieldId: string;
    storageId: string;
    type: string;
    columnName: string;
    searchable: boolean;
    sortable: boolean;
    settings?: Record<string, any>;
    parents: IModelFieldParent[];
}

export type ModelFields = Record<string, IModelField>;

export interface IApplyFilteringParams {
    query: Knex.QueryBuilder;
    column: string;
    operator: string;
    value: unknown;
}

export type ApplyFilteringCb = (params: IApplyFilteringParams) => void;
export type GetFilterCb = (type: string) => SqlEntryFilter.Interface;

export interface ISqlEntryFilterExecParams {
    applyFiltering: ApplyFilteringCb;
    getFilter: GetFilterCb;
    key: string;
    value: unknown;
    operator: string;
    field: IModelField;
    fields: ModelFields;
    query: Knex.QueryBuilder;
}

export interface ISqlEntryFilter {
    readonly fieldType: string;
    exec(params: ISqlEntryFilterExecParams): void;
}

export const SqlEntryFilter = createAbstraction<ISqlEntryFilter>("Cms/Sql/EntryFilter");

export namespace SqlEntryFilter {
    export type Interface = ISqlEntryFilter;
    export type ExecParams = ISqlEntryFilterExecParams;
    export type ApplyFiltering = ApplyFilteringCb;
    export type GetFilter = GetFilterCb;
}
