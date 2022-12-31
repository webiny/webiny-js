import { CmsEntryElasticsearchQueryBuilderValueSearchPlugin } from "~/plugins";
import { ElasticsearchQueryBuilderOperatorPlugin } from "@webiny/api-elasticsearch";
import { CmsModelField } from "@webiny/api-headless-cms/types";

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
    isSearchable: boolean;
    isSortable: boolean;
    type: FieldType;
    isSystemField?: boolean;
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
export interface ElasticsearchQueryBuilderOperatorPlugins {
    [key: string]: ElasticsearchQueryBuilderOperatorPlugin;
}
/**
 * ./plugins/search
 */
export interface ElasticsearchQuerySearchValuePlugins {
    [fieldType: string]: CmsEntryElasticsearchQueryBuilderValueSearchPlugin;
}
