import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin.js";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

export class OpenSearchQueryBuilderOperatorGreaterThanPlugin extends OpenSearchQueryBuilderOperatorPlugin {
    public override name = "opensearch.queryBuilder.operator.greaterThan.default";

    public getOperator(): string {
        return "gt";
    }

    public apply(query: OpenSearchBoolQueryConfig, params: OpenSearchQueryBuilderArgsPlugin): void {
        const { value, basePath } = params;
        query.filter.push({
            range: {
                [basePath]: {
                    gt: value
                }
            }
        });
    }
}
