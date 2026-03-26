import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin.js";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

export class OpenSearchQueryBuilderOperatorNotBetweenPlugin extends OpenSearchQueryBuilderOperatorPlugin {
    public override name = "opensearch.queryBuilder.operator.notBetween.default";

    public getOperator(): string {
        return "not_between";
    }

    public apply(query: OpenSearchBoolQueryConfig, params: OpenSearchQueryBuilderArgsPlugin): void {
        const { value, basePath, name } = params;
        if (Array.isArray(value) === false) {
            throw new Error(
                `You cannot filter field path "${name}" with "not_between" query and not send an array of values.`
            );
        } else if (value.length !== 2) {
            throw new Error(
                `You must pass 2 values in the array for field path "${name}" filtering.`
            );
        }
        // we take gte first because it should be a lesser value than lte, eg [5, 10]
        // 6 >= gte && 6 <= lte === true which in this case it means that record will not match
        const [gte, lte] = value;
        query.must_not.push({
            range: {
                [basePath]: {
                    lte,
                    gte
                }
            }
        });
    }
}
