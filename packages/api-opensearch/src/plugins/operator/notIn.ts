import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin.js";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

export class OpenSearchQueryBuilderOperatorNotInPlugin extends OpenSearchQueryBuilderOperatorPlugin {
    public override name = "opensearch.queryBuilder.operator.notIn.default";

    public getOperator(): string {
        return "not_in";
    }

    public apply(
        query: OpenSearchBoolQueryConfig,
        params: OpenSearchQueryBuilderArgsPlugin
    ): void {
        const { value: values, path, basePath, name } = params;
        const isArray = Array.isArray(values);
        if (isArray === false || values.length === 0) {
            throw new Error(
                `You cannot filter field "${name}" with "not_in" operator and not send an array of values.`
            );
        }

        const useBasePath = values.some(
            (value: string | number | boolean | null | undefined) => typeof value !== "string"
        );

        query.must_not.push({
            terms: {
                [useBasePath ? basePath : path]: values
            }
        });
    }
}
