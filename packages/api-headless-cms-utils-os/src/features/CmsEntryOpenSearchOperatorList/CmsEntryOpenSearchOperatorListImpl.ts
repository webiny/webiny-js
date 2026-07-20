import { OpenSearchQueryBuilderOperatorRegistry } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { OpenSearchQueryBuilderOperators } from "~/operations/entry/elasticsearch/types.js";
import { CmsEntryOpenSearchOperatorList } from "./abstractions.js";

class CmsEntryOpenSearchOperatorListClass implements CmsEntryOpenSearchOperatorList.Interface {
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

export const CmsEntryOpenSearchOperatorListImpl =
    CmsEntryOpenSearchOperatorList.createImplementation({
        implementation: CmsEntryOpenSearchOperatorListClass,
        dependencies: [OpenSearchQueryBuilderOperatorRegistry]
    });
