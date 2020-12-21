import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderContainsPlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-contains",
    targetOperation: "contains",
    apply(query, { field, value }) {
        query.must.push({
            // eslint-disable-next-line @typescript-eslint/camelcase
            simple_query_string: {
                fields: [field],
                query: value,
                operator: "AND"
            }
        });
    }
});
