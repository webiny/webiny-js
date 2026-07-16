import type { OpenSearchQueryBuilderOperatorRegistry } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { OpenSearchQueryBuilderOperators } from "../types.js";

interface Params {
    registry: OpenSearchQueryBuilderOperatorRegistry.Interface;
}

export const createOperatorPluginList = (params: Params): OpenSearchQueryBuilderOperators => {
    const { registry } = params;
    return registry.getAll().reduce<OpenSearchQueryBuilderOperators>((acc, operator) => {
        acc[operator.getOperator()] = operator;
        return acc;
    }, {});
};
