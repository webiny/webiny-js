import { ElasticsearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderNotContainsPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-not-contains",
    operator: "not_contains",
    apply(query, { field, value }) {
        query.mustNot.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: [field],
                query: `*${value}*`
            }
        });
    }
});
