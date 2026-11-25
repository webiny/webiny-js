import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsUnpublishParams
} from "@webiny/api-headless-cms/types/index.js";
import { UnpublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UnpublishEntryStorageOperation.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import {
    CmsEntryOpenSearchFieldIndexRegistry,
    CmsEntryOpenSearchValuesModifier,
    CmsModelOpenSearchIndexProvider
} from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { createConfigurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { createTransformer } from "./transformations/index.js";
import {
    createEntryLatestKeys,
    createEntryRevisionKeys,
    createPartitionKey,
    createPublishedSortKey
} from "./keys.js";

class DdbEsUnpublishEntryImpl implements UnpublishEntryStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsEntryEntity.Interface,
        private esEntity: CmsDdbEsEntriesEsEntity.Interface,
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface,
        private compressionHandler: CompressionHandler.Interface,
        private indexProvider: CmsModelOpenSearchIndexProvider.Interface,
        private valuesModifiers: CmsEntryOpenSearchValuesModifier.Interface[],
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ) {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const tenant = this.scopeTenant.getId(
            initialModel.tenant,
            initialEntry.tenant,
            initialStorageEntry.tenant
        );
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const transformer = createTransformer({
            valuesModifiers: this.valuesModifiers,
            model,
            entry: { ...initialEntry, tenant },
            storageEntry: { ...initialStorageEntry, tenant },
            fieldIndexRegistry: this.fieldIndexRegistry,
            compressionHandler: this.compressionHandler
        });
        const { entry, storageEntry } = await transformer.transformEntryKeys();

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await this.dataLoaders.getLatestRevisionByEntryId({
            model: { tenant, modelId: model.modelId },
            ids: [entry.id]
        });

        const partitionKey = createPartitionKey({
            id: entry.id,
            tenant
        });

        const entryRevisionKeys = createEntryRevisionKeys(entry, tenant);

        const entityBatch = this.entity.createEntityWriter({
            put: [
                {
                    ...entryRevisionKeys,
                    data: storageEntry
                }
            ],
            delete: [
                {
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                }
            ]
        });

        const elasticsearchEntityBatch = this.esEntity.createEntityWriter({
            delete: [
                {
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                }
            ]
        });

        /**
         * If we are unpublishing the latest revision, let's also update the latest revision entry's status in both DynamoDB tables.
         */
        if (latestStorageEntry?.id === entry.id) {
            const configurations = createConfigurations(this.indexProvider);
            const { index } = await configurations.es({
                model
            });

            const entryLatestKeys = createEntryLatestKeys(storageEntry, tenant);
            entityBatch.put({
                ...entryLatestKeys,
                data: storageEntry
            });

            const esLatestData = await transformer.getElasticsearchLatestEntryData();

            elasticsearchEntityBatch.put({
                index,
                data: esLatestData,
                ...entryLatestKeys
            });
        }

        /**
         * Finally, execute regular table batch.
         */
        try {
            await entityBatch.execute();

            this.dataLoaders.clearAll({
                tenant
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not store unpublished entry records in DynamoDB table.",
                ex.code || "UNPUBLISH_ERROR",
                {
                    entry,
                    storageEntry
                }
            );
        }
        /**
         * And Elasticsearch table batch.
         */
        try {
            await elasticsearchEntityBatch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not store unpublished entry records in DynamoDB Elasticsearch table.",
                ex.code || "UNPUBLISH_ERROR",
                {
                    entry,
                    storageEntry
                }
            );
        }
        return initialStorageEntry;
    }
}

export const DdbEsUnpublishEntry = UnpublishEntryStorageOperation.createImplementation({
    implementation: DdbEsUnpublishEntryImpl,
    dependencies: [
        CmsDdbEsEntryEntity,
        CmsDdbEsEntriesEsEntity,
        CmsDdbEsDataLoaders,
        CmsStorageModelProvider,
        CmsEntryOpenSearchFieldIndexRegistry,
        CompressionHandler,
        CmsModelOpenSearchIndexProvider,
        [CmsEntryOpenSearchValuesModifier, { multiple: true }],
        ScopeTenant
    ]
});
