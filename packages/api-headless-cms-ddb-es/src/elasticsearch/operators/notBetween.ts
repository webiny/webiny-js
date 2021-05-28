import { ElasticsearchQueryBuilderPlugin } from "../../types";

export const elasticsearchOperatorNotBetweenPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-not-between",
    operator: "not_between",
    apply(query, { field, value }) {
        if (Array.isArray(value) === false) {
            throw new Error(
                `You cannot filter "${field}" with between query and not send an array of values.`
            );
        } else if (value.length !== 2) {
            throw new Error(`You must pass 2 values in the array for field "${field}" filtering.`);
        }
        // we take gte first because it should be a lesser value than lte, eg [5, 10]
        // 6 >= gte && 6 <= lte === true which in this case it means that record will not match
        const [gte, lte] = value;
        query.mustNot.push({
            range: {
                [field]: {
                    lte,
                    gte
                }
            }
        });
    }
});
