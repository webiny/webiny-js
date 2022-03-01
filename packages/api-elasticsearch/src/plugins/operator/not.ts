import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorNotPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public override name = "elasticsearch.queryBuilder.operator.not.default";

    public getOperator(): string {
        return "not";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value, path, basePath } = params;

        if (value === null) {
            query.must.push({
                exists: {
                    field: path
                }
            });
            return;
        }

        const useBasePath = typeof value !== "string";
        query.must_not.push({
            term: {
                [useBasePath ? basePath : path]: value
            }
        });
    }
}
