import { Plugin } from "@webiny/plugins";
import { ElasticsearchBoolQueryConfig, ElasticsearchQueryBuilderArgsPlugin } from "~/types";

/**
 * Built-in operators name ends with .default because user can override the operator, just write a name without the .default keyword.
 */
export abstract class ElasticsearchQueryBuilderOperatorPlugin extends Plugin {
    public static readonly type = "elasticsearch.queryBuilder.operator";

    public abstract getOperator(): string;

    public abstract apply(
        query: ElasticsearchBoolQueryConfig,
        params: ElasticsearchQueryBuilderArgsPlugin
    ): void;
}
