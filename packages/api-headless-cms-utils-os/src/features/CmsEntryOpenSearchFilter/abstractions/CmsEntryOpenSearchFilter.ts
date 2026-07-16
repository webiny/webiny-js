import { createAbstraction } from "@webiny/feature/api";
import type { ModelField, ModelFields } from "~/operations/entry/elasticsearch/types.js";
import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types.js";

interface ApplyParams {
    key: string;
    value: any;
    query: OpenSearchBoolQueryConfig;
    operator: string;
    field: ModelField;
}

export interface ApplyFilteringCb {
    (params: ApplyParams): void;
}

export interface GetFilterCb {
    (type: string): CmsEntryOpenSearchFilter.Interface;
}

export interface IExecParams {
    applyFiltering: ApplyFilteringCb;
    getFilter: GetFilterCb;
    key: string;
    value: any;
    operator: string;
    field: ModelField;
    fields: ModelFields;
    query: OpenSearchBoolQueryConfig;
}

export interface ICmsEntryOpenSearchFilter {
    readonly fieldType: string;
    exec(params: IExecParams): void;
}

export const CmsEntryOpenSearchFilter = createAbstraction<ICmsEntryOpenSearchFilter>(
    "Cms/Entry/OpenSearch/Filter"
);

export namespace CmsEntryOpenSearchFilter {
    export type Interface = ICmsEntryOpenSearchFilter;
    export type ExecParams = IExecParams;
    export type ApplyFiltering = ApplyFilteringCb;
    export type GetFilter = GetFilterCb;
}
