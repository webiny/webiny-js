import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorGreaterThanPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public name = "elasticsearch.queryBuilder.operator.greaterThan.default";

    public getOperator(): string {
        return "gt";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value, basePath } = params;
        query.must.push({
            range: {
                [basePath]: {
                    gt: value
                }
            }
        });
    }
}
