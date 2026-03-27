import { Plugin } from "@webiny/plugins";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

/**
 * Built-in operators name ends with .default because user can override the operator, just write a name without the .default keyword.
 */
export abstract class OpenSearchQueryBuilderOperatorPlugin extends Plugin {
    public static override readonly type: string = "opensearch.queryBuilder.operator";

    public abstract getOperator(): string;

    public abstract apply(
        query: OpenSearchBoolQueryConfig,
        params: OpenSearchQueryBuilderArgsPlugin
    ): void;
}
