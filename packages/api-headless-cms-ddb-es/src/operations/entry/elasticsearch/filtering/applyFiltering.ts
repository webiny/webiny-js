import WebinyError from "@webiny/error";
import { transformValueForSearch } from "~/operations/entry/elasticsearch/transformValueForSearch";
import { hasKeyword } from "~/operations/entry/elasticsearch/keyword";
import type {
    ElasticsearchQueryBuilderOperatorPlugins,
    ElasticsearchQuerySearchValuePlugins
} from "~/operations/entry/elasticsearch/types";
import { createFieldPathFactory } from "~/operations/entry/elasticsearch/filtering/path";
import type { ApplyFilteringCb } from "~/plugins/CmsEntryFilterPlugin";

interface CreateParams {
    operatorPlugins: ElasticsearchQueryBuilderOperatorPlugins;
    searchPlugins: ElasticsearchQuerySearchValuePlugins;
}

export const createApplyFiltering = ({
    operatorPlugins,
    searchPlugins
}: CreateParams): ApplyFilteringCb => {
    const createFieldPath = createFieldPathFactory({
        plugins: searchPlugins
    });

    return params => {
        const { key, value: initialValue, query, operator, field } = params;

        const plugin = operatorPlugins[operator];
        if (!plugin) {
            throw new WebinyError(
                `Elasticsearch operator "${operator}" plugin missing.`,
                "PLUGIN_MISSING",
                {
                    operator
                }
            );
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
            originalValue: initialValue,
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
