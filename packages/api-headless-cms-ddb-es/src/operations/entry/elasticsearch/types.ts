import type { OpenSearchQueryBuilderOperatorPlugin } from "@webiny/api-opensearch";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { CmsEntryOpenSearchValueSearch } from "~/features/CmsEntryOpenSearchValueSearch/index.js";

/**
 * ./fields
 */
type ModelFieldPath = string | ((value: string) => string);

export type FieldType = "text" | "date" | "datetime" | "time" | "number" | "boolean" | string;

export interface ModelFieldParent {
    fieldId: string;
    storageId: string;
    type: FieldType;
}
export interface ModelField {
    unmappedType?: string;
    keyword?: boolean;
    searchable: boolean;
    sortable: boolean;
    type: FieldType;
    systemField?: boolean;
    field: CmsModelField;
    path?: ModelFieldPath;
    fullTextSearch?: boolean;
    parents: ModelFieldParent[];
}

export interface ModelFields {
    [fieldId: string]: ModelField;
}

/**
 * ./plugins/operator
 */
export interface OpenSearchQueryBuilderOperatorPlugins {
    [key: string]: OpenSearchQueryBuilderOperatorPlugin;
}
/**
 * ./plugins/search
 */
export interface OpenSearchQuerySearchValuePlugins {
    [fieldType: string]: CmsEntryOpenSearchValueSearch.Interface;
}
