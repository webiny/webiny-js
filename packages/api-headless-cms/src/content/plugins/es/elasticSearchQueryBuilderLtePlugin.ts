import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderLtePlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-lte",
    targetOperation: "lte",
    apply(query, { field, value }) {
        query.must.push({
            range: {
                [field]: {
                    lte: value
                }
            }
        });
    }
});
