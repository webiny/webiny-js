import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsDeleteRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryRevisionStorageOperation.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import {
    CmsEntryOpenSearchFieldIndexRegistry,
    CmsEntryOpenSearchValuesModifier
} from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { CmsModelOpenSearchIndexProvider } from "~/features/CmsModelOpenSearchIndex/index.js";
import { createConfigurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { createTransformer } from "./transformations/index.js";
import {
    createEntryLatestKeys,
    createEntryRevisionKeys,
    createPartitionKey,
    createPublishedSortKey,
    createRevisionSortKey
} from "./keys.js";
import { convertToStorageEntry } from "./storageEntryUtils.js";

class DdbEsDeleteEntryRevisionImpl implements DeleteEntryRevisionStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsEntryEntity.Interface,
        private esEntity: CmsDdbEsEntriesEsEntity.Interface,
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface,
        private compressionHandler: CompressionHandler.Interface,
        private indexProvider: CmsModelOpenSearchIndexProvider.Interface,
        private valuesModifiers: CmsEntryOpenSearchValuesModifier.Interface[]
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ): Promise<void> {
        const { entry, latestEntry, latestStorageEntry: initialLatestStorageEntry } = params;
        const model = this.storageModelProvider.getModel(initialModel);

        const partitionKey = createPartitionKey({
            id: entry.id,
            tenant: model.tenant
        });

        const configurations = createConfigurations(this.indexProvider);
        const { index } = await configurations.es({
            model
        });
        /**
         * We need published entry to delete it if necessary.
         */
        const [publishedStorageEntry] = await this.dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: [entry.id]
        });
        /**
         * We need to delete all existing records of the given entry revision.
         */
        const entityBatch = this.entity.createEntityWriter({
            delete: [
                {
                    PK: partitionKey,
                    SK: createRevisionSortKey(entry)
                }
            ]
        });

        const elasticsearchEntityBatch = this.esEntity.createEntityWriter();

        /**
         * If revision we are deleting is the published one as well, we need to delete those records as well.
         */
        if (publishedStorageEntry?.id === entry.id) {
            entityBatch.delete({
                PK: partitionKey,
                SK: createPublishedSortKey()
            });

            elasticsearchEntityBatch.delete({
                PK: partitionKey,
                SK: createPublishedSortKey()
            });
        }

        if (latestEntry && initialLatestStorageEntry) {
            const latestStorageEntry = convertToStorageEntry({
                storageEntry: initialLatestStorageEntry,
                model
            });

            /**
             * In the end we need to set the new latest entry.
             */
            const latestStorageEntryLatestKey = createEntryLatestKeys(latestStorageEntry);
            entityBatch.put({
                ...latestStorageEntryLatestKey,
                data: latestStorageEntry
            });

            /**
             * Also perform an update on the actual revision. This is needed
             * because of updates on the entry-level meta fields.
             */
            const actualRevisionEntryKey = createEntryRevisionKeys(initialLatestStorageEntry);
            entityBatch.put({
                ...actualRevisionEntryKey,
                data: latestStorageEntry
            });

            const latestTransformer = createTransformer({
                valuesModifiers: this.valuesModifiers,
                model,
                entry: latestEntry,
                storageEntry: initialLatestStorageEntry,
                fieldIndexRegistry: this.fieldIndexRegistry,
                compressionHandler: this.compressionHandler
            });

            const esLatestData = await latestTransformer.getElasticsearchLatestEntryData();

            const esLatestKeys = createEntryLatestKeys(latestEntry);
            elasticsearchEntityBatch.put({
                ...esLatestKeys,
                index,
                data: esLatestData
            });
        }

        try {
            await entityBatch.execute();

            this.dataLoaders.clearAll({
                tenant: entry.tenant
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch write entry records to DynamoDB table.",
                ex.code || "DELETE_REVISION_ERROR",
                {
                    error: ex,
                    entry,
                    latestEntry,
                    initialLatestStorageEntry
                }
            );
        }

        try {
            await elasticsearchEntityBatch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not batch write entry records to DynamoDB Elasticsearch table.",
                ex.code || "DELETE_REVISION_ERROR",
                {
                    error: ex,
                    entry,
                    latestEntry,
                    initialLatestStorageEntry
                }
            );
        }
    }
}

export const DdbEsDeleteEntryRevision = DeleteEntryRevisionStorageOperation.createImplementation({
    implementation: DdbEsDeleteEntryRevisionImpl,
    dependencies: [
        CmsDdbEsEntryEntity,
        CmsDdbEsEntriesEsEntity,
        CmsDdbEsDataLoaders,
        CmsStorageModelProvider,
        CmsEntryOpenSearchFieldIndexRegistry,
        CompressionHandler,
        CmsModelOpenSearchIndexProvider,
        [CmsEntryOpenSearchValuesModifier, { multiple: true }]
    ]
});
