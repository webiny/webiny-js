import { ElasticSearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderGtPlugin = (): ElasticSearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-gt",
    targetOperation: "gt",
    apply(query, { field, value }) {
        query.must.push({
            range: {
                [field]: {
                    gt: value
                }
            }
        });
    }
});
