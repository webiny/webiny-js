import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { normalizeValue } from "~/normalize";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export class ElasticsearchQueryBuilderJapaneseOperatorContainsPlugin extends ElasticsearchQueryBuilderOperatorPlugin {
    public override name = "elasticsearch.queryBuilder.operator.contains.japanese";

    public override isLocaleSupported(code: string): boolean {
        if (!code) {
            return false;
        }
        return ["ja", "ja-jp"].includes(code.toLowerCase());
    }

    public getOperator(): string {
        return "contains";
    }

    public apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void {
        const { value: initialValue, basePath } = params;

        const value = normalizeValue(initialValue);
        query.must.push({
            multi_match: {
                query: value,
                type: "phrase",
                fields: [`${basePath}.ngram`]
            }
        });
        query.should.push({
            multi_match: {
                query: value,
                type: "phrase",
                fields: [`${basePath}`]
            }
        });
    }
}
