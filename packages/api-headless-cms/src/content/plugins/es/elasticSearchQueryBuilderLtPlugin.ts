import { ElasticsearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderLtPlugin = (): ElasticsearchQueryBuilderPlugin => ({
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
