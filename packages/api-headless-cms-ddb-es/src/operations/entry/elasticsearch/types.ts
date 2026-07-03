import type { OpenSearchQueryBuilderOperator } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

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

export interface OpenSearchQueryBuilderOperators {
    [key: string]: OpenSearchQueryBuilderOperator.Interface;
}
