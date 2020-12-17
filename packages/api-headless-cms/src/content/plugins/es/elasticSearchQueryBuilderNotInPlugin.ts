import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderNotInPlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-not-in",
    targetOperation: "not_in",
    apply(query, { field, value }) {
        query.mustNot.push({
            term: {
                [`${field}.keyword`]: value
            }
        });
    }
});
