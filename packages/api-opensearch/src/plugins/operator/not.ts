import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin.js";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

export class OpenSearchQueryBuilderOperatorNotPlugin extends OpenSearchQueryBuilderOperatorPlugin {
    public override name = "opensearch.queryBuilder.operator.not.default";

    public getOperator(): string {
        return "not";
    }

    public apply(
        query: OpenSearchBoolQueryConfig,
        params: OpenSearchQueryBuilderArgsPlugin
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
