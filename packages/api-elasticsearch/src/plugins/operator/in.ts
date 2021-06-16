import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition";
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
        const { value: values, path } = params;
        const isArray = Array.isArray(values);
        if (isArray === false || values.length === 0) {
            throw new Error(
                `You cannot filter field "${path}" with "in" operator and not send an array of values.`
            );
        }

        // Only use ".keyword" if all of the provided values are strings.
        for (const value of values) {
            if (typeof value !== "string") {
                query.must.push({
                    terms: {
                        [path]: values
                    }
                });
                return;
            }
        }

        query.must.push({
            terms: {
                [`${path}.keyword`]: values
            }
        });
    }
}
