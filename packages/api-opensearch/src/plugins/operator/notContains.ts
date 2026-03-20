import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin.js";
import { normalizeValueWithAsterisk } from "~/normalize.js";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

export class OpenSearchQueryBuilderOperatorNotContainsPlugin extends OpenSearchQueryBuilderOperatorPlugin {
    public override name = "opensearch.queryBuilder.operator.notContains.default";

    public getOperator(): string {
        return "not_contains";
    }

    public apply(
        query: OpenSearchBoolQueryConfig,
        params: OpenSearchQueryBuilderArgsPlugin
    ): void {
        const { value, basePath } = params;
        query.must_not.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: [basePath],
                query: normalizeValueWithAsterisk(value),
                default_operator: "and"
            }
        });
    }
}
