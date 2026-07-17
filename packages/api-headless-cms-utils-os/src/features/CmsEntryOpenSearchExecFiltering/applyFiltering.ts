import WebinyError from "@webiny/error";
import { hasKeyword } from "~/operations/entry/elasticsearch/keyword.js";
import type { OpenSearchQueryBuilderOperators } from "~/operations/entry/elasticsearch/types.js";
import type { CmsEntryOpenSearchFilter } from "~/features/CmsEntryOpenSearchFilter/index.js";
import type { CmsEntryOpenSearchValueTransformer } from "~/features/CmsEntryOpenSearchValueTransformer/index.js";
import type { CmsEntryOpenSearchFieldPathFactory } from "~/features/CmsEntryOpenSearchFieldPathFactory/index.js";

interface CreateParams {
    operators: OpenSearchQueryBuilderOperators;
    valueTransformer: CmsEntryOpenSearchValueTransformer.Interface;
    fieldPathFactory: CmsEntryOpenSearchFieldPathFactory.Interface;
}

export const createApplyFiltering = ({
    operators,
    valueTransformer,
    fieldPathFactory
}: CreateParams): CmsEntryOpenSearchFilter.ApplyFiltering => {
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

        const value = valueTransformer.transform({
            field: field.field,
            value: initialValue
        });

        const keyword = hasKeyword(field);

        const { basePath, path } = fieldPathFactory.create({
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
