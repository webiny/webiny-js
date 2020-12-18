import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderNotInPlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-not-in",
    targetOperation: "not_in",
    apply(query, { field, value }) {
        if (Array.isArray(value) === false) {
            throw new Error(
                `You cannot filter "${field}" with not_in and not send an array of values.`
            );
        }
        query.mustNot.push({
            term: {
                [`${field}.keyword`]: value
            }
        });
    }
});
