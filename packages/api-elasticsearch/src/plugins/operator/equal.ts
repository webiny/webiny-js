import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorEqualPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public name = "elasticsearch.queryBuilder.operator.equal.default";

    public getOperator(): string {
        return "eq";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value, path } = params;
        /**
         * In case we are searching for a string, use keyword.
         */
        if (typeof value === "string") {
            query.must.push({
                term: {
                    [`${path}.keyword`]: value
                }
            });
            return;
        }
        /**
         * And in other cases do not use keyword because it finds nothing.
         */
        query.must.push({
            term: {
                [path]: value
            }
        });
    }
}
