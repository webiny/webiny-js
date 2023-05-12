import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorInPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public override name = "elasticsearch.queryBuilder.operator.in.default";

    public getOperator(): string {
        return "in";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
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
