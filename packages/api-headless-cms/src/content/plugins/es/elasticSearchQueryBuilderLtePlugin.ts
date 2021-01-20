import { ElasticsearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderLtePlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "elastic-search-query-builder",
    name: "elastic-search-query-builder-lte",
    operator: "lte",
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
