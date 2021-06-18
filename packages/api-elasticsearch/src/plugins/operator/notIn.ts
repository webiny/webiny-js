import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorNotInPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public name = "elasticsearch.queryBuilder.operator.notIn.default";

    public getOperator(): string {
        return "not_in";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value: values, path, basePath } = params;
        const isArray = Array.isArray(values);
        if (isArray === false || values.length === 0) {
            throw new Error(
                `You cannot filter field path "${basePath}" with not_in and not send an array of values.`
            );
        }

        const useBasePath = values.some(value => typeof value !== "string");

        query.must_not.push({
            terms: {
                [useBasePath ? basePath : path]: values
            }
        });
    }
}
