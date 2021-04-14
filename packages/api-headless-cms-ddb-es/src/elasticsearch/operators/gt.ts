import { ElasticsearchQueryBuilderPlugin } from "../../types";

export const elasticsearchOperatorGtPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-gt",
    operator: "gt",
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
