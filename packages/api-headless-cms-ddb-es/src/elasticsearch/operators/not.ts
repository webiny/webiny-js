import { ElasticsearchQueryBuilderPlugin } from "../../types";

export const elasticsearchOperatorNotPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-not",
    operator: "not",
    apply(query, { field, value }) {
        query.mustNot.push({
            term: {
                [`${field}.keyword`]: value
            }
        });
    }
});
