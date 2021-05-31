import { ElasticsearchQueryBuilderPlugin } from "../../types";

export const elasticsearchOperatorNotContainsPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-not-contains",
    operator: "not_contains",
    apply(query, { field, value }) {
        query.must_not.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: [field],
                query: `*${value}*`
            }
        });
    }
});
