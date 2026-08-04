import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsPublishParams
} from "@webiny/api-headless-cms/types/index.js";
import { CONTENT_ENTRY_STATUS } from "@webiny/api-headless-cms/types/index.js";
import { PublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
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
    createEntryPublishedKeys,
    createEntryRevisionKeys
} from "./keys.js";
import {
    isEntryLevelEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants.js";
import type { CmsIndexEntry } from "@webiny/api-headless-cms-utils-os/types.js";
import type { IOpenSearchEntityAttributes as IElasticsearchEntityAttributes } from "@webiny/api-opensearch";

class DdbEsPublishEntryImpl implements PublishEntryStorageOperation.Interface {
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
        params: CmsEntryStorageOperationsPublishParams<T>
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

        const revisionKeys = createEntryRevisionKeys(entry);
        const latestKeys = createEntryLatestKeys(entry);
        const publishedKeys = createEntryPublishedKeys(entry);

        let latestEsEntry: IElasticsearchEntityAttributes | null = null;
        try {
            latestEsEntry = await this.esEntity.getClean(latestKeys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read Elasticsearch latest data.",
                ex.code || "PUBLISH_LATEST_READ",
                {
                    error: ex,
                    latestKeys: latestKeys,
                    publishedKeys: publishedKeys
                }
            );
        }

        if (!latestEsEntry) {
            throw new WebinyError(
                `Could not publish entry. Could not load latest ("L") record (ES table).`,
                "PUBLISH_ERROR",
                { entry }
            );
        }

        /**
         * We need the latest entry to check if it needs to be updated as well in the Elasticsearch.
         */
        const [latestStorageEntry] = await this.dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        if (!latestStorageEntry) {
            throw new WebinyError(
                `Could not publish entry. Could not load latest ("L") record.`,
                "PUBLISH_ERROR",
                { entry }
            );
        }

        /**
         * We need currently published entry to check if need to remove it.
         */
        const [publishedStorageEntry] = await this.dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        // 1. Update REV# and P records with new data.
        const entityBatch = this.entity.createEntityWriter({
            put: [
                {
                    ...revisionKeys,
                    data: storageEntry
                },
                {
                    ...publishedKeys,
                    data: storageEntry
                }
            ]
        });

        const elasticsearchEntityWriter = this.esEntity.createEntityWriter();

        const configurations = createConfigurations(this.indexProvider);
        const { index: esIndex } = await configurations.es({
            model
        });

        // 2. When it comes to the latest record, we need to perform a couple of different
        // updates, based on whether the entry being published is the latest revision or not.
        const publishedRevisionId = publishedStorageEntry?.id;
        const publishingLatestRevision = latestStorageEntry?.id === entry.id;

        if (publishingLatestRevision) {
            // 2.1 If we're publishing the latest revision, we first need to update the L record.
            entityBatch.put({
                ...latestKeys,
                data: storageEntry
            });

            // 2.2 Additionally, if we have a previously published entry, we need to mark it as unpublished.
            //     Note that we need to take re-publishing into account (same published revision being
            //     published again), in which case the below code does not apply. This is because the
            //     required updates were already applied above.
            if (publishedStorageEntry) {
                const isRepublishing = publishedStorageEntry.id === entry.id;
                if (!isRepublishing) {
                    /**
                     * Update currently published entry (unpublish it)
                     */
                    const publishedStorageEntryKeys =
                        createEntryRevisionKeys(publishedStorageEntry);
                    entityBatch.put({
                        ...publishedStorageEntryKeys,
                        data: {
                            ...publishedStorageEntry,
                            status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                        }
                    });
                }
            }
        } else {
            // 2.3 If the published revision is not the latest one, the situation is a bit
            // more complex. We first need to update the L and REV# records with the new
            // values of *only entry-level* meta fields.
            const updatedEntryLevelMetaFields = pickEntryMetaFields(
                entry,
                isEntryLevelEntryMetaField
            );

            // 2.4 Update L record. Apart from updating the entry-level meta fields, we also need
            //    to change the status from "published" to "unpublished" (if the status is set to "published").
            let latestRevisionStatus = latestStorageEntry.status;
            if (latestRevisionStatus === CONTENT_ENTRY_STATUS.PUBLISHED) {
                latestRevisionStatus = CONTENT_ENTRY_STATUS.UNPUBLISHED;
            }

            const latestStorageEntryFields = {
                ...latestStorageEntry,
                ...updatedEntryLevelMetaFields,
                status: latestRevisionStatus
            };

            const latestStorageEntryLatestKeys = createEntryLatestKeys(latestStorageEntry);
            entityBatch.put({
                ...latestStorageEntryLatestKeys,
                data: latestStorageEntryFields
            });

            // 2.5 Update REV# record.
            const latestStorageEntryRevisionKeys = createEntryRevisionKeys(latestStorageEntry);
            entityBatch.put({
                ...latestStorageEntryRevisionKeys,
                data: latestStorageEntryFields
            });

            // 2.6 Additionally, if we have a previously published entry, we need to mark it as unpublished.
            //     Note that we need to take re-publishing into account (same published revision being
            //     published again), in which case the below code does not apply. This is because the
            //     required updates were already applied above.
            if (publishedStorageEntry) {
                const isRepublishing = publishedStorageEntry.id === entry.id;
                const publishedRevisionDifferentFromLatest =
                    publishedRevisionId !== latestStorageEntry.id;

                if (!isRepublishing && publishedRevisionDifferentFromLatest) {
                    const publishedStorageEntryRevisionKeys =
                        createEntryRevisionKeys(publishedStorageEntry);
                    entityBatch.put({
                        ...publishedStorageEntryRevisionKeys,
                        data: {
                            ...publishedStorageEntry,
                            status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                        }
                    });
                }
            }
        }

        // 3. Update records in ES -> DDB table.

        /**
         * Update the published revision entry in ES.
         */
        const esPublishedData = await transformer.getElasticsearchPublishedEntryData();
        elasticsearchEntityWriter.put({
            ...publishedKeys,
            index: esIndex,
            data: esPublishedData
        });

        /**
         * Need to decompress the data from Elasticsearch DynamoDB table.
         *
         * No need to transform it for the storage because it was fetched
         * directly from the Elasticsearch table, where it sits transformed.
         */
        const latestEsEntryDataDecompressed = (await this.compressionHandler.decompress(
            latestEsEntry.data
        )) as CmsIndexEntry;

        if (publishingLatestRevision) {
            const updatedMetaFields = pickEntryMetaFields(entry);

            const latestTransformer = createTransformer({
                valuesModifiers: this.valuesModifiers,
                model,
                transformedToIndex: {
                    ...latestEsEntryDataDecompressed,
                    status: CONTENT_ENTRY_STATUS.PUBLISHED,
                    locked: true,
                    ...updatedMetaFields
                },
                fieldIndexRegistry: this.fieldIndexRegistry,
                compressionHandler: this.compressionHandler
            });

            const esEntryLatestKeys = createEntryLatestKeys(latestEsEntryDataDecompressed);
            elasticsearchEntityWriter.put({
                index: esIndex,
                data: await latestTransformer.getElasticsearchLatestEntryData(),
                ...esEntryLatestKeys
            });
        } else {
            const updatedEntryLevelMetaFields = pickEntryMetaFields(
                entry,
                isEntryLevelEntryMetaField
            );

            /**
             * Update the Elasticsearch table to propagate changes to the Elasticsearch.
             */
            const latestEsEntry = await this.esEntity.getClean(latestKeys);

            if (latestEsEntry) {
                const latestEsEntryDataDecompressed = (await this.compressionHandler.decompress(
                    latestEsEntry.data
                )) as CmsIndexEntry;

                let latestRevisionStatus = latestEsEntryDataDecompressed.status;
                if (latestRevisionStatus === CONTENT_ENTRY_STATUS.PUBLISHED) {
                    latestRevisionStatus = CONTENT_ENTRY_STATUS.UNPUBLISHED;
                }

                const updatedLatestEntry = await this.compressionHandler.compress({
                    ...latestEsEntryDataDecompressed,
                    ...updatedEntryLevelMetaFields,
                    status: latestRevisionStatus
                });

                elasticsearchEntityWriter.put({
                    ...latestKeys,
                    index: esIndex,
                    data: updatedLatestEntry
                });
            }
        }

        /**
         * Finally, execute regular table batch.
         */
        try {
            await entityBatch.execute();

            this.dataLoaders.clearAll({
                tenant: entry.tenant
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not store publish entry records in DynamoDB table.",
                ex.code || "PUBLISH_ERROR",
                {
                    error: ex,
                    entry,
                    latestStorageEntry,
                    publishedStorageEntry
                }
            );
        }
        /**
         * And Elasticsearch table batch.
         */
        try {
            await elasticsearchEntityWriter.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not store publish entry records in DynamoDB Elasticsearch table.",
                ex.code || "PUBLISH_ES_ERROR",
                {
                    error: ex,
                    entry,
                    latestStorageEntry,
                    publishedStorageEntry
                }
            );
        }
        return initialStorageEntry;
    }
}

export const DdbEsPublishEntry = PublishEntryStorageOperation.createImplementation({
    implementation: DdbEsPublishEntryImpl,
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
