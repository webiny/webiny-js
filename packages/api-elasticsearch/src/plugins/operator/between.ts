import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorBetweenPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public override name = "elasticsearch.queryBuilder.operator.between.default";

    public getOperator(): string {
        return "between";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value, basePath } = params;
        if (Array.isArray(value) === false) {
            throw new Error(
                `You cannot filter field path "${basePath}" with between query and not send an array of values.`
            );
        } else if (value.length !== 2) {
            throw new Error(
                `You must pass 2 values in the array for field path "${basePath}" filtering.`
            );
        }
        // we take gte first because it should be a lesser value than lte, eg [5, 10]
        // 6 >= gte && 6 <= lte
        const [gte, lte] = value;
        query.must.push({
            range: {
                [basePath]: {
                    lte,
                    gte
                }
            }
        });
    }
}
