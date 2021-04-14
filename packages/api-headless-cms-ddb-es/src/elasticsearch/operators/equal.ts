import { ElasticsearchQueryBuilderPlugin } from "../../types";

export const elasticsearchOperatorEqualPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-eq",
    operator: "eq",
    apply(query, { field, value }) {
        if (typeof value === "string") {
            query.must.push({
                term: {
                    [`${field}.keyword`]: value
                }
            });
        } else {
            query.must.push({
                term: {
                    [field]: value
                }
            });
        }
    }
});
