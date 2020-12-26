import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderNotContainsPlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-not-contains",
    targetOperation: "not_contains",
    apply(query, { field, value }) {
        query.mustNot.push({
            // eslint-disable-next-line @typescript-eslint/camelcase
            query_string: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                allow_leading_wildcard: true,
                fields: [field],
                query: value
            }
        });
    }
});
