import { OpenSearchQueryBuilderOperatorRegistry } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { OpenSearchQueryBuilderOperators } from "~/operations/entry/elasticsearch/types.js";
import { CmsEntryOpenSearchOperatorList as CmsEntryOpenSearchOperatorListAbstraction } from "./abstractions.js";

class CmsEntryOpenSearchOperatorListImpl
    implements CmsEntryOpenSearchOperatorListAbstraction.Interface
{
    public constructor(
        private readonly registry: OpenSearchQueryBuilderOperatorRegistry.Interface
    ) {}

    public getAll(): OpenSearchQueryBuilderOperators {
        return this.registry.getAll().reduce<OpenSearchQueryBuilderOperators>((acc, operator) => {
            acc[operator.getOperator()] = operator;
            return acc;
        }, {});
    }
}

export const CmsEntryOpenSearchOperatorList =
    CmsEntryOpenSearchOperatorListAbstraction.createImplementation({
        implementation: CmsEntryOpenSearchOperatorListImpl,
        dependencies: [OpenSearchQueryBuilderOperatorRegistry]
    });
