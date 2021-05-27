import { ElasticsearchQueryBuilderPlugin } from "../../types";

export const elasticsearchOperatorNotPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-not",
    operator: "not",
    apply(query, { field, value }) {
        if (typeof value === "string") {
            query.mustNot.push({
                term: {
                    [`${field}.keyword`]: value
                }
            });
        } else {
            query.mustNot.push({
                term: {
                    [`${field}`]: value
                }
            });
        }
    }
});
