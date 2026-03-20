import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin.js";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

export class OpenSearchQueryBuilderOperatorGreaterThanOrEqualToPlugin extends OpenSearchQueryBuilderOperatorPlugin {
    public override name = "opensearch.queryBuilder.operator.greaterThanOrEqualTo.default";

    public getOperator(): string {
        return "gte";
    }

    public apply(
        query: OpenSearchBoolQueryConfig,
        params: OpenSearchQueryBuilderArgsPlugin
    ): void {
        const { value, basePath } = params;
        query.filter.push({
            range: {
                [basePath]: {
                    gte: value
                }
            }
        });
    }
}
