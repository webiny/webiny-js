import { ElasticsearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderContainsPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-contains",
    operator: "contains",
    apply(query, { field, value }) {
        query.must.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: [field],
                query: `*${value}*`
            }
        });
    }
});
