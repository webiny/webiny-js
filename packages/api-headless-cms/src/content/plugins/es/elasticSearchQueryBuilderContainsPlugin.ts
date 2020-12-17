import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderContainsPlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-contains",
    targetOperation: "contains",
    apply(query, { field, value }) {
        query.match.push({
            [field]: {
                query: value,
                operator: "AND"
            }
        });
    }
});
