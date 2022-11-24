import { CmsEntryElasticsearchQueryBuilderValueSearchPlugin } from "~/plugins";
import { CmsModelField } from "@webiny/api-headless-cms/types";
import { ElasticsearchQueryBuilderOperatorPlugin } from "@webiny/api-elasticsearch";

/**
 * ./fields
 */
type ModelFieldPath = string | ((value: string) => string);

export interface ModelField {
    unmappedType?: string;
    keyword?: boolean;
    isSearchable: boolean;
    isSortable: boolean;
    type: string;
    isSystemField?: boolean;
    field: CmsModelField;
    path?: ModelFieldPath;
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
