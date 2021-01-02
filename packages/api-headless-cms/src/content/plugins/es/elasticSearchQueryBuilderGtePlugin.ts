import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderGtePlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-gte",
    operator: "gte",
    apply(query, { field, value }) {
        query.must.push({
            range: {
                [field]: {
                    gte: value
                }
            }
        });
    }
});
