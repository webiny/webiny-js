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

        if (value === null || value === undefined) {
            query.filter.push({
                exists: {
                    field: path
                }
            });
            return;
        }

        const typeOf = typeof value;

        if (typeOf === "boolean") {
            query.filter.push({
                bool: {
                    must_not: {
                        term: {
                            [path]: value
                        }
                    }
                }
            });
            return;
        }

        const useBasePath = typeOf !== "string";
        const valuePath = useBasePath ? basePath : path;
        query.must_not.push({
            term: {
                [valuePath]: value
            }
        });
    }
}
