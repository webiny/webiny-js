import { EntrySearchOperations as Abstraction } from "./abstractions/EntrySearchOperations.js";
import type { IEntrySearchOperations } from "./abstractions/EntrySearchOperations.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import {
    CmsEntryOpenSearchBodyBuilder,
    CmsEntryOpenSearchFieldIndexRegistry
} from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { SearchOperationDeps } from "./search/types.js";
import { createListOperation } from "./search/list.js";
import { createGetOperation } from "./search/get.js";
import { createGetUniqueFieldValuesOperation } from "./search/getUniqueFieldValues.js";

class EntrySearchOperationsImpl implements IEntrySearchOperations {
    public readonly list: IEntrySearchOperations["list"];
    public readonly get: IEntrySearchOperations["get"];
    public readonly getUniqueFieldValues: IEntrySearchOperations["getUniqueFieldValues"];

    public constructor(
        openSearchClient: OpenSearchClient.Interface,
        bodyBuilder: CmsEntryOpenSearchBodyBuilder.Interface,
        fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface,
        fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface,
        storageModelProvider: CmsStorageModelProvider.Interface
    ) {
        const deps: SearchOperationDeps = {
            elasticsearch: openSearchClient.use(),
            bodyBuilder,
            fieldRegistry,
            fieldIndexRegistry,
            getStorageOperationsModel: model => storageModelProvider.getModel(model)
        };

        this.list = createListOperation(deps);
        this.get = createGetOperation(deps);
        this.getUniqueFieldValues = createGetUniqueFieldValuesOperation(deps);
    }
}

export const EntrySearchOperations = Abstraction.createImplementation({
    implementation: EntrySearchOperationsImpl,
    dependencies: [
        OpenSearchClient,
        CmsEntryOpenSearchBodyBuilder,
        CmsModelFieldToGraphQLRegistry,
        CmsEntryOpenSearchFieldIndexRegistry,
        CmsStorageModelProvider
    ]
});
