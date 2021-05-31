import { ElasticsearchQueryBuilderPlugin } from "../../types";

export const elasticsearchOperatorNotInPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-not-in",
    operator: "not_in",
    apply(query, { field, value: values }) {
        if (Array.isArray(values) === false) {
            throw new Error(
                `You cannot filter "${field}" with not_in and not send an array of values.`
            );
        }

        // Only use ".keyword" if all of the provided values are strings.
        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            if (typeof value !== "string") {
                query.mustNot.push({
                    terms: {
                        [field]: values
                    }
                });
                return;
            }
        }

        query.mustNot.push({
            terms: {
                [`${field}.keyword`]: values
            }
        });
    }
});
