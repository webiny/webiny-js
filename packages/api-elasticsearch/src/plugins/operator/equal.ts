import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorEqualPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public override name = "elasticsearch.queryBuilder.operator.equal.default";

    public getOperator(): string {
        return "eq";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value, path, basePath } = params;

        if (value === null) {
            query.must_not.push({
                exists: {
                    field: path
                }
            });
            return;
        }
        /**
         * In case we are searching for a string, use regular path.
         * Otherwise use base path
         */
        const useBasePath = typeof value !== "string";
        query.must.push({
            term: {
                [useBasePath ? basePath : path]: value
            }
        });
    }
}
