import { ElasticsearchQueryBuilderPlugin } from "../../types";

export const elasticsearchOperatorInPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-in",
    operator: "in",
    apply(query, { field, value: values }) {
        if (Array.isArray(values) === false || values.length === 0) {
            throw new Error(
                `You cannot filter field "${field}" with "in" operator and not send an array of values.`
            );
        }

        // Only use ".keyword" if all of the provided values are strings.
        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            if (typeof value !== "string") {
                query.must.push({
                    terms: {
                        [field]: values
                    }
                });
                return;
            }
        }

        query.must.push({
            terms: {
                [`${field}.keyword`]: values
            }
        });
    }
});
