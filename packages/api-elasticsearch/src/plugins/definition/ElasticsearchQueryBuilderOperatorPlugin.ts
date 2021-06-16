import { Plugin } from "@webiny/plugins";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

export abstract class ElasticsearchQueryBuilderOperatorPlugin extends Plugin {
    public static readonly type = "elasticsearch.queryBuilder.operator";

    public abstract getOperator(): string;

    public abstract apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void;
}
