import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import { UpdateRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateRevisionStorageOperation.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import {
    CmsEntryOpenSearchFieldIndexRegistry,
    CmsEntryOpenSearchValuesModifier
} from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { createTransformer } from "./transformations/index.js";
import { createEntryRevisionKeys } from "./keys.js";

/**
 * Writes the revision record only. The OpenSearch index holds the latest and published revisions,
 * which this operation doesn't touch, so there is nothing to index.
 */
class DdbEsUpdateRevisionImpl implements UpdateRevisionStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsEntryEntity.Interface,
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface,
        private compressionHandler: CompressionHandler.Interface,
        private valuesModifiers: CmsEntryOpenSearchValuesModifier.Interface[]
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ) {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const model = this.storageModelProvider.getModel(initialModel);

        const transformer = createTransformer({
            valuesModifiers: this.valuesModifiers,
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry,
            fieldIndexRegistry: this.fieldIndexRegistry,
            compressionHandler: this.compressionHandler
        });

        const { storageEntry } = transformer.transformEntryKeys();

        const entityBatch = this.entity.createEntityWriter({
            put: [
                {
                    ...createEntryRevisionKeys(storageEntry),
                    data: storageEntry
                }
            ]
        });

        try {
            await entityBatch.execute();
            this.dataLoaders.clearAll({
                tenant: initialEntry.tenant
            });
            return initialStorageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update revision.",
                ex.code || "UPDATE_REVISION_ERROR",
                {
                    error: ex,
                    entry: initialEntry
                }
            );
        }
    }
}

export const DdbEsUpdateRevision = UpdateRevisionStorageOperation.createImplementation({
    implementation: DdbEsUpdateRevisionImpl,
    dependencies: [
        CmsDdbEsEntryEntity,
        CmsDdbEsDataLoaders,
        CmsStorageModelProvider,
        CmsEntryOpenSearchFieldIndexRegistry,
        CompressionHandler,
        [CmsEntryOpenSearchValuesModifier, { multiple: true }]
    ]
});
