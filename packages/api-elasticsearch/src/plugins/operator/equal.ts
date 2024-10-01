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

        if (value === null || value === undefined) {
            query.must_not.push({
                exists: {
                    field: path
                }
            });
            return;
        }
        const typeOf = typeof value;
        /**
         * If value is a number or boolean, use filtering instead of must/term
         */
        if (typeOf === "number" || typeOf === "boolean") {
            query.filter.push({
                term: {
                    [basePath]: value
                }
            });
            return;
        }
        /**
         * In case we are searching for a string, use regular path.
         * Otherwise use base path.
         */
        const useBasePath = typeOf !== "string";
        const valuePath = useBasePath ? basePath : path;
        /**
         * String or something else.
         */
        query.filter.push({
            term: {
                [valuePath]: value
            }
        });
    }
}
