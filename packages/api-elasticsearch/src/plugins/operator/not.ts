import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorNotPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public name = "elasticsearch.queryBuilder.operator.not.default";

    public getOperator(): string {
        return "not";
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
            query.must_not.push({
                term: {
                    [`${path}.keyword`]: value
                }
            });
            return;
        }
        /**
         * And in other cases do not use keyword because it finds nothing.
         */
        query.must_not.push({
            term: {
                [`${path}`]: value
            }
        });
    }
}
