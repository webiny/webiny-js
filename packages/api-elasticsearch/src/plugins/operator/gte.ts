import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public name = "elasticsearch.queryBuilder.operator.greaterThanOrEqualTo.default";

    public getOperator(): string {
        return "gte";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value, path } = params;
        query.must.push({
            range: {
                [path]: {
                    gte: value
                }
            }
        });
    }
}
