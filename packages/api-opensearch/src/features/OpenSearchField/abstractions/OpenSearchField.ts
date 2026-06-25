import { createAbstraction } from "@webiny/feature/exports/api.js";
import type { FieldSortOptions } from "~/types.js";
import type { SortOrder } from "~/types.js";

export interface ToSearchValueParams {
    value: any;
    path: string;
    basePath: string;
}

export interface OpenSearchFieldParams {
    field: string;
    path?: string;
    keyword?: boolean;
    unmappedType?: string;
    sortable?: boolean;
    searchable?: boolean;
    toSearchValue?: (params: ToSearchValueParams) => any;
}

export interface IOpenSearchField {
    readonly field: string;
    readonly path: string;
    readonly keyword: boolean;
    readonly unmappedType?: string;
    readonly sortable: boolean;
    readonly searchable: boolean;
    getPath(field: string): string;
    getBasePath(field: string): string;
    getSortOptions(order: SortOrder): FieldSortOptions;
    toSearchValue(params: ToSearchValueParams): any;
}

export const OpenSearchField = createAbstraction<IOpenSearchField>("OpenSearch/Field");

export namespace OpenSearchField {
    export type Interface = IOpenSearchField;
    export type Params = OpenSearchFieldParams;
    export type SearchValueParams = ToSearchValueParams;
}

/* The wildcard sentinel value used to match any field path. */
export const OpenSearchFieldAll = "*" as const;
