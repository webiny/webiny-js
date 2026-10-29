import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types.js";
import { normalizeValue } from "@webiny/api-opensearch";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { CmsEntryOpenSearchFullTextSearch } from "~/features/CmsEntryOpenSearchFullTextSearch/index.js";
import type { ModelFields } from "~/operations/entry/elasticsearch/types.js";

/**
 * Our default implementation works with the AND operator for the multiple words query string.
 */
const defaultFullTextSearch: CmsEntryOpenSearchFullTextSearch.Interface = {
    apply: params => {
        const { query, term, fields, createFieldPath, prepareTerm } = params;

        query.must.push({
            query_string: {
                allow_leading_wildcard: true,
                /**
                 * Searchable JSON fields are dynamically mapped, so their subfields can be of any type (date, number, boolean...).
                 * Wildcard queries are not allowed on those types, so we need to ignore them instead of failing the whole query.
                 */
                lenient: true,
                fields: Object.values(fields).map(createFieldPath),
                query: `*${prepareTerm(term)}*`,
                default_operator: "and"
            }
        });
    }
};

interface GetFullTextSearchParams {
    fullTextSearches: CmsEntryOpenSearchFullTextSearch.Interface[];
    model: CmsModel;
}
const getFullTextSearch = (
    params: GetFullTextSearchParams
): CmsEntryOpenSearchFullTextSearch.Interface => {
    const { fullTextSearches, model } = params;
    /**
     * We need to reverse the list, so we can take the last one first - possibility to override existing implementations.
     */
    const reversed = [...fullTextSearches].reverse();
    /**
     * We need to find the most specific implementation for the given model.
     * Also, we need to use the first possible implementation if the specific one is not found.
     */
    let fallback: CmsEntryOpenSearchFullTextSearch.Interface | null = null;
    for (const item of reversed) {
        const models = item.models || [];
        /**
         * We take the first available implementation for the given model.
         */
        if (models.includes(model.modelId)) {
            return item;
        } else if (!fallback && models.length === 0) {
            /**
             * Then we set the first possible implementation, which has no models defined, as the default one.
             * It is important not to set the one which has models defined as they are specifically for the targeted model.
             */
            fallback = item;
        }
    }

    return fallback || defaultFullTextSearch;
};

interface Params {
    fullTextSearches: CmsEntryOpenSearchFullTextSearch.Interface[];
    model: CmsModel;
    query: OpenSearchBoolQueryConfig;
    term?: string;
    fields: ModelFields;
}
export const applyFullTextSearch = (params: Params): void => {
    const { fullTextSearches, query, term, fields, model } = params;
    const keys = Object.keys(fields);
    if (!term || term.length === 0 || keys.length === 0) {
        return;
    }

    const fullTextSearch = getFullTextSearch({
        fullTextSearches,
        model
    });

    fullTextSearch.apply({
        model,
        createFieldPath: field => {
            if (typeof field.path === "function") {
                return field.path(term);
            } else if (field.systemField) {
                return field.path || field.field.storageId;
            }
            /**
             * Fields can live inside object fields, so we need to prepend the storage ids of all the parents.
             * Root fields have the `values` parent only.
             */
            const parents =
                field.parents.length > 0 ? field.parents.map(p => p.storageId) : ["values"];
            const path = [...parents, field.path || field.field.storageId].join(".");
            /**
             * Searchable JSON fields are indexed as objects, so the actual searchable values
             * live on the nested keys. Target them all via a wildcard.
             */
            if (field.type === "searchable-json") {
                return `${path}.*`;
            }
            return path;
        },
        fields,
        query,
        term,
        prepareTerm: normalizeValue
    });
};
