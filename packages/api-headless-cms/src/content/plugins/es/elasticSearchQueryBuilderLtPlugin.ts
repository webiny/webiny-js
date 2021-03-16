import { ElasticsearchQueryBuilderPlugin } from "../../../types";

export const elasticSearchQueryBuilderLtPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
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
