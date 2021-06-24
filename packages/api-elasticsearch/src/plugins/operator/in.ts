import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorInPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public name = "elasticsearch.queryBuilder.operator.in.default";

    public getOperator(): string {
        return "in";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
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

        query.must.push({
            terms: {
                [useBasePath ? basePath : path]: values
            }
        });
    }
}
