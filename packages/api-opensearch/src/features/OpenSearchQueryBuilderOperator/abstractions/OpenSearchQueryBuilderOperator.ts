import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";
import { createAbstraction } from "@webiny/feature/exports/api.js";

export interface IOpenSearchQueryBuilderOperator {
    getOperator(): string;
    apply(query: OpenSearchBoolQueryConfig, params: OpenSearchQueryBuilderArgsPlugin): void;
}

export const OpenSearchQueryBuilderOperator = createAbstraction<IOpenSearchQueryBuilderOperator>(
    "OpenSearch/QueryBuilder/Operator"
);

export namespace OpenSearchQueryBuilderOperator {
    export type Interface = IOpenSearchQueryBuilderOperator;
    export type Query = OpenSearchBoolQueryConfig;
    export type Params = OpenSearchQueryBuilderArgsPlugin;
}
