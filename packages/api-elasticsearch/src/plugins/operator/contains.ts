import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition";
import { normalizeValue } from "~/normalize";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderOperatorContainsPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public name = "elasticsearch.queryBuilder.operator.contains.default";

    public getOperator(): string {
        return "contains";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value, path } = params;
        query.must.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: [path],
                query: normalizeValue(value),
                default_operator: "and"
            }
        });
    }
}
