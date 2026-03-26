import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin.js";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

export class OpenSearchQueryBuilderOperatorAndInPlugin extends OpenSearchQueryBuilderOperatorPlugin {
    public override name = "opensearch.queryBuilder.operator.andIn.default";

    public getOperator(): string {
        return "and_in";
    }

    public apply(query: OpenSearchBoolQueryConfig, params: OpenSearchQueryBuilderArgsPlugin): void {
        const { value: values, path, basePath } = params;
        const isArray = Array.isArray(values);
        if (isArray === false || values.length === 0) {
            throw new Error(
                `You cannot filter field "${path}" with "in" operator and not send an array of values.`
            );
        }

        let useBasePath = false;
        // Only use ".keyword" if all of the provided values are strings.
        for (const value of values) {
            if (typeof value !== "string") {
                useBasePath = true;
                break;
            }
        }

        for (const value of values) {
            query.filter.push({
                term: {
                    [useBasePath ? basePath : path]: value
                }
            });
        }
    }
}
