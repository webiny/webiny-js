import { ElasticsearchQueryBuilderPlugin } from "../../types";

export const elasticsearchOperatorBetweenPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-between",
    operator: "between",
    apply(query, { field, value }) {
        if (Array.isArray(value) === false) {
            throw new Error(
                `You cannot filter "${field}" with between query and not send an array of values.`
            );
        } else if (value.length !== 2) {
            throw new Error(`You must pass 2 values in the array for field "${field}" filtering.`);
        }
        // we take gte first because it should be a lesser value than lte, eg [5, 10]
        // 6 >= gte && 6 <= lte
        const [gte, lte] = value;
        query.must.push({
            range: {
                [field]: {
                    lte,
                    gte
                }
            }
        });
    }
});
