import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import WebinyError from "@webiny/error";
import { transformValueForSearch } from "~/operations/entry/elasticsearch/transformValueForSearch";
import { hasKeyword } from "~/operations/entry/elasticsearch/keyword";
import {
    ElasticsearchQueryBuilderOperatorPlugins,
    ElasticsearchQuerySearchValuePlugins,
    ModelField
} from "~/operations/entry/elasticsearch/types";
import { createFieldPathFactory } from "~/operations/entry/elasticsearch/filtering/path";

interface CreateParams {
    operatorPlugins: ElasticsearchQueryBuilderOperatorPlugins;
    searchPlugins: ElasticsearchQuerySearchValuePlugins;
}
interface ApplyParams {
    key: string;
    value: any;
    query: ElasticsearchBoolQueryConfig;
    operator: string;
    field: ModelField;
}

export const createApplyFiltering = ({ operatorPlugins, searchPlugins }: CreateParams) => {
    const createFieldPath = createFieldPathFactory({
        plugins: searchPlugins
    });

    return (params: ApplyParams) => {
        const { key, value: initialValue, query, operator, field } = params;

        const plugin = operatorPlugins[operator];
        if (!plugin) {
            throw new WebinyError("Operator plugin missing.", "PLUGIN_MISSING", {
                operator
            });
        }

        const value = transformValueForSearch({
            plugins: searchPlugins,
            field: field.field,
            value: initialValue
        });

        const keyword = hasKeyword(field);

        const { basePath, path } = createFieldPath({
            field,
            value,
            key,
            keyword
        });

        plugin.apply(query, {
            name: field.field.fieldId,
            basePath,
            path,
            value,
            keyword
        });
    };
};
