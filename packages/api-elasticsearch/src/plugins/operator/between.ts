import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorBetweenPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public name = "elasticsearch.queryBuilder.operator.between.default";

    public getOperator(): string {
        return "between";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value, path } = params;
        if (Array.isArray(value) === false) {
            throw new Error(
                `You cannot filter "${path}" with between query and not send an array of values.`
            );
        } else if (value.length !== 2) {
            throw new Error(`You must pass 2 values in the array for field "${path}" filtering.`);
        }
        // we take gte first because it should be a lesser value than lte, eg [5, 10]
        // 6 >= gte && 6 <= lte
        const [gte, lte] = value;
        query.must.push({
            range: {
                [path]: {
                    lte,
                    gte
                }
            }
        });
    }
}
