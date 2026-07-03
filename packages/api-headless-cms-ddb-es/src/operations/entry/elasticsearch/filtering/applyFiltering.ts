import WebinyError from "@webiny/error";
import { transformValueForSearch } from "~/operations/entry/elasticsearch/transformValueForSearch.js";
import { hasKeyword } from "~/operations/entry/elasticsearch/keyword.js";
import type { OpenSearchQueryBuilderOperators } from "~/operations/entry/elasticsearch/types.js";
import { createFieldPathFactory } from "~/operations/entry/elasticsearch/filtering/path.js";
import type { CmsEntryOpenSearchFilter } from "~/features/CmsEntryOpenSearchFilter/index.js";
import type { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch/index.js";

interface CreateParams {
    operators: OpenSearchQueryBuilderOperators;
    valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface;
}

export const createApplyFiltering = ({
    operators,
    valueSearchRegistry
}: CreateParams): CmsEntryOpenSearchFilter.ApplyFiltering => {
    const createFieldPath = createFieldPathFactory({
        valueSearchRegistry
    });

    return params => {
        const { key, value: initialValue, query, operator, field } = params;

        const plugin = operators[operator];
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
            valueSearchRegistry,
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
