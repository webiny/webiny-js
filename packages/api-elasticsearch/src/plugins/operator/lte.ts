import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition";
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
        const { value, path } = params;
        query.must.push({
            range: {
                [path]: {
                    lte: value
                }
            }
        });
    }
}
