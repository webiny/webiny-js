import { ElasticsearchQueryBuilderPlugin } from "@webiny/api-headless-cms/types";

export const elasticSearchQueryBuilderInPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-in",
    operator: "in",
    apply(query, { field, value: values }) {
        if (Array.isArray(values) === false || values.length === 0) {
            throw new Error(
                `You cannot filter field "${field}" with "in" operator and not send an array of values.`
            );
        }
        query.must.push({
            terms: {
                [`${field}.keyword`]: values
            }
        });
    }
});
