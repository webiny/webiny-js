import { ElasticsearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderNotPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-not",
    operator: "not",
    apply(query, { field, value }) {
        query.mustNot.push({
            term: {
                [`${field}.keyword`]: value
            }
        });
    }
});
