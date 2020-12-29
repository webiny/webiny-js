import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderLtPlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-lt",
    operator: "lt",
    apply(query, { field, value }) {
        query.must.push({
            range: {
                [field]: {
                    lt: value
                }
            }
        });
    }
});
