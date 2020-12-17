import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderBetweenPlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-between",
    targetOperation: "between",
    apply(query, { field, value }) {
        const [gte, lte] = value;
        query.range.push({
            [`${field}.keyword`]: {
                lte,
                gte
            }
        });
    }
});
