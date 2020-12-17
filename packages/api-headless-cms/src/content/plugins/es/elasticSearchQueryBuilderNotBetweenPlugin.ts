import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderNotBetweenPlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-not-between",
    targetOperation: "not_between",
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
