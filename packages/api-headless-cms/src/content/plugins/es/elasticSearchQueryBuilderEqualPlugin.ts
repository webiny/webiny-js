import { ElasticsearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderEqualPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-eq",
    operator: "eq",
    apply(query, { field, value }) {
        query.must.push({
            term: {
                [`${field}.keyword`]: value
            }
        });
    }
});
