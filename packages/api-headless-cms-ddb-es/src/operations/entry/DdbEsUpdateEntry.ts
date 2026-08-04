import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import { UpdateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
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
import { createConfigurations } from "~/configurations.js";
import { createTransformer } from "./transformations/index.js";
import {
    createEntryLatestKeys,
    createEntryPublishedKeys,
    createEntryRevisionKeys,
    createPartitionKey,
    createRevisionSortKey
} from "./keys.js";
import {
    isEntryLevelEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants.js";
import type { IEntryEntityAttributes } from "~/definitions/types.js";
import type { CmsIndexEntry } from "@webiny/api-headless-cms-utils-os/types.js";

class DdbEsUpdateEntryImpl implements UpdateEntryStorageOperation.Interface {
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

        const { entry, storageEntry } = transformer.transformEntryKeys();

        const isPublished = entry.status === "published";
        const locked = isPublished ? true : entry.locked;

        const revisionKeys = createEntryRevisionKeys(entry);
        const latestKeys = createEntryLatestKeys(entry);
        const publishedKeys = createEntryPublishedKeys(entry);

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await this.dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        const [publishedStorageEntry] = await this.dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        const entityBatch = this.entity.createEntityWriter({
            put: [
                {
                    ...revisionKeys,
                    data: {
                        ...storageEntry,
                        locked
                    }
                }
            ]
        });

        if (isPublished) {
            entityBatch.put({
                ...publishedKeys,
                data: {
                    ...storageEntry,
                    locked
                }
            });
        }

        const elasticsearchEntityBatch = this.esEntity.createEntityWriter();

        const configurations = createConfigurations(this.indexProvider);
        const { index: esIndex } = await configurations.es({
            model
        });

        /**
         * If the latest entry is the one being updated, we need to create a new latest entry records.
         */
        if (latestStorageEntry) {
            const updatingLatestRevision = latestStorageEntry.id === entry.id;
            if (updatingLatestRevision) {
                /**
                 * First we update the regular DynamoDB table.
                 */
                entityBatch.put({
                    ...latestKeys,
                    data: storageEntry
                });

                /**
                 * And then update the Elasticsearch table to propagate changes to the Elasticsearch
                 */
                const elasticsearchLatestData = await transformer.getElasticsearchLatestEntryData();

                elasticsearchEntityBatch.put({
                    ...latestKeys,
                    index: esIndex,
                    data: elasticsearchLatestData
                });
            } else {
                /**
                 * If not updating latest revision, we still want to update the latest revision's
                 * entry-level meta fields to match the current revision's entry-level meta fields.
                 */
                const updatedEntryLevelMetaFields = pickEntryMetaFields(
                    entry,
                    isEntryLevelEntryMetaField
                );

                const updatedLatestStorageEntry: IEntryEntityAttributes = {
                    ...latestKeys,
                    data: {
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields
                    }
                };

                /**
                 * First we update the regular DynamoDB table. Two updates are needed:
                 * - one for the actual revision record
                 * - one for the latest record
                 */
                entityBatch.put({
                    ...updatedLatestStorageEntry,
                    PK: createPartitionKey({
                        id: latestStorageEntry.id,
                        tenant: model.tenant
                    }),
                    SK: createRevisionSortKey(latestStorageEntry)
                });

                entityBatch.put({
                    ...updatedLatestStorageEntry
                });

                /**
                 * Update the Elasticsearch table to propagate changes to the Elasticsearch.
                 */
                const latestEsEntry = await this.esEntity.getClean(latestKeys);

                if (latestEsEntry) {
                    const latestEsEntryDataDecompressed = (await this.compressionHandler.decompress(
                        latestEsEntry.data
                    )) as CmsIndexEntry;

                    const updatedLatestEntry = await this.compressionHandler.compress({
                        ...latestEsEntryDataDecompressed,
                        ...updatedEntryLevelMetaFields
                    });

                    elasticsearchEntityBatch.put({
                        ...latestKeys,
                        index: esIndex,
                        data: updatedLatestEntry
                    });
                }
            }
        }

        if (isPublished && publishedStorageEntry?.id === entry.id) {
            const elasticsearchPublishedData =
                await transformer.getElasticsearchPublishedEntryData();
            elasticsearchEntityBatch.put({
                ...publishedKeys,
                index: esIndex,
                data: elasticsearchPublishedData
            });
        }
        try {
            await entityBatch.execute();

            this.dataLoaders.clearAll({
                tenant: entry.tenant
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update entry DynamoDB records.",
                ex.code || "UPDATE_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }
        try {
            await elasticsearchEntityBatch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update entry DynamoDB Elasticsearch records.",
                ex.code || "UPDATE_ES_ENTRY_ERROR",
                {
                    error: ex,
                    entry
                }
            );
        }
        return initialStorageEntry;
    }
}

export const DdbEsUpdateEntry = UpdateEntryStorageOperation.createImplementation({
    implementation: DdbEsUpdateEntryImpl,
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
