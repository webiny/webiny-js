import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin.js";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

export class OpenSearchQueryBuilderOperatorNotStartsWithPlugin extends OpenSearchQueryBuilderOperatorPlugin {
    public override name = "opensearch.queryBuilder.operator.notStartsWith.default";

    public getOperator(): string {
        return "not_startsWith";
    }

    public apply(
        query: OpenSearchBoolQueryConfig,
        params: OpenSearchQueryBuilderArgsPlugin
    ): void {
        const { value, basePath } = params;
        if (value === "" || value === null || value === undefined) {
            return;
        }
        query.must_not.push({
            match_phrase_prefix: {
                [basePath]: value
            }
        });
    }
}
