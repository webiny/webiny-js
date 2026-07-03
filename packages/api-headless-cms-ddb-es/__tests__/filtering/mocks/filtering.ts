import {
    createExecFiltering as baseCreateExecFiltering,
    type CreateExecFilteringResponse
} from "~/operations/entry/elasticsearch/filtering";
import { createFields, createModel } from "./fields";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch";
import { CmsEntryOpenSearchFilterRegistry } from "~/features/CmsEntryOpenSearchFilter";
import { OpenSearchQueryBuilderOperatorRegistry } from "@webiny/api-opensearch/exports/api/opensearch";

export type { CreateExecFilteringResponse };

export const createExecFiltering = () => {
    const testContainer = createTestContainer();
    const operatorRegistry = testContainer.resolve(OpenSearchQueryBuilderOperatorRegistry);
    const valueSearchRegistry = testContainer.resolve(CmsEntryOpenSearchValueSearchRegistry);
    const filterRegistry = testContainer.resolve(CmsEntryOpenSearchFilterRegistry);

    return baseCreateExecFiltering({
        operatorRegistry,
        fields: createFields(),
        model: createModel(),
        valueSearchRegistry,
        filterRegistry
    });
};
