import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderNotContainsPlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-not-contains",
    targetOperation: "not_contains",
    apply(query, { field, value }) {
        query.mustNot.push({
            term: {
                [`${field}.keyword`]: value
            }
        });
    }
});
