import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin.js";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

export class OpenSearchQueryBuilderOperatorInPlugin extends OpenSearchQueryBuilderOperatorPlugin {
    public override name = "opensearch.queryBuilder.operator.in.default";

    public getOperator(): string {
        return "in";
    }

    public apply(query: OpenSearchBoolQueryConfig, params: OpenSearchQueryBuilderArgsPlugin): void {
        const { value: values, path, basePath, name } = params;
        const isArray = Array.isArray(values);
        if (isArray === false || values.length === 0) {
            throw new Error(
                `You cannot filter field "${name}" with "in" operator and not send an array of values.`
            );
        }

        // Only use ".keyword" if all of the provided values are strings.
        const useBasePath = values.some(
            (value: string | number | boolean | null | undefined) => typeof value !== "string"
        );

        query.filter.push({
            terms: {
                [useBasePath ? basePath : path]: values
            }
        });
    }
}
