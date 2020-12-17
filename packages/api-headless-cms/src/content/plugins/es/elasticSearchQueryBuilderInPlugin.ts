import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderInPlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-in",
    targetOperation: "in",
    apply(query, { field, value }) {
        query.must.push({
            term: {
                [`${field}.keyword`]: value
            }
        });
    }
});
