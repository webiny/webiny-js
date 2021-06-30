import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public name = "elasticsearch.queryBuilder.operator.lesserThanOrEqualTo.default";

    public getOperator(): string {
        return "lte";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value, basePath } = params;
        query.must.push({
            range: {
                [basePath]: {
                    lte: value
                }
            }
        });
    }
}
