import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin.js";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

export class OpenSearchQueryBuilderOperatorEqualPlugin extends OpenSearchQueryBuilderOperatorPlugin {
    public override name = "opensearch.queryBuilder.operator.equal.default";

    public getOperator(): string {
        return "eq";
    }

    public apply(
        query: OpenSearchBoolQueryConfig,
        params: OpenSearchQueryBuilderArgsPlugin
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
