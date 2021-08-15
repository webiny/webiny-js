import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
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
        const { value, basePath } = params;
        query.must.push({
            range: {
                [basePath]: {
                    gte: value
                }
            }
        });
    }
}
