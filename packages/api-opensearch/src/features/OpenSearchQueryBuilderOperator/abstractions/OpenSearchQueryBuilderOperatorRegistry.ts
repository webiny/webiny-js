import { createAbstraction } from "@webiny/feature/exports/api.js";
import type { OpenSearchQueryBuilderOperator } from "./OpenSearchQueryBuilderOperator.js";

export interface IOpenSearchQueryBuilderOperatorRegistry {
    get(operator: string): OpenSearchQueryBuilderOperator.Interface | undefined;
    getAll(): OpenSearchQueryBuilderOperator.Interface[];
}

export const OpenSearchQueryBuilderOperatorRegistry =
    createAbstraction<IOpenSearchQueryBuilderOperatorRegistry>(
        "OpenSearch/QueryBuilder/OperatorRegistry"
    );

export namespace OpenSearchQueryBuilderOperatorRegistry {
    export type Interface = IOpenSearchQueryBuilderOperatorRegistry;
    export type Operator = OpenSearchQueryBuilderOperator.Interface;
}
