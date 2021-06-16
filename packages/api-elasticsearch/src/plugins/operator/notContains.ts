import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition";
import { normalizeValue } from "./utils";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorNotContainsPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public name = "elasticsearch.queryBuilder.operator.notContains.default";

    public getOperator(): string {
        return "not_contains";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value, path } = params;
        query.must_not.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: [path],
                query: normalizeValue(value),
                default_operator: "and"
            }
        });
    }
}
