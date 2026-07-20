import type { Container } from "@webiny/feature/api";
import type { Client as OpenSearchClient } from "@webiny/api-opensearch";
import { CmsEntryOpenSearchBodyBuilder } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { createStorageModelAccessor } from "@webiny/api-headless-cms-storage";
import type { IEntrySearchOperations } from "./abstractions/EntrySearchOperations.js";
import type { SearchOperationDeps } from "./search/types.js";
import { createListOperation } from "./search/list.js";
import { createGetOperation } from "./search/get.js";
import { createGetUniqueFieldValuesOperation } from "./search/getUniqueFieldValues.js";

interface CreateEntrySearchOperationsParams {
    container: Container;
    elasticsearch: OpenSearchClient;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
}

export const createEntrySearchOperations = (
    params: CreateEntrySearchOperationsParams
): IEntrySearchOperations => {
    const { container, elasticsearch, fieldRegistry, fieldIndexRegistry } = params;

    const bodyBuilder = container.resolve(CmsEntryOpenSearchBodyBuilder);
    const { getModel: getStorageOperationsModel } = createStorageModelAccessor(container);

    const deps: SearchOperationDeps = {
        elasticsearch,
        bodyBuilder,
        fieldRegistry,
        fieldIndexRegistry,
        getStorageOperationsModel
    };

    return {
        list: createListOperation(deps),
        get: createGetOperation(deps),
        getUniqueFieldValues: createGetUniqueFieldValuesOperation(deps)
    };
};
