import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsCreateRevisionFromParams
} from "@webiny/api-headless-cms/types/index.js";
import { CONTENT_ENTRY_STATUS } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryRevisionFromStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
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
    createEntryRevisionKeys
} from "./keys.js";

class DdbEsCreateEntryRevisionFromImpl
    implements CreateEntryRevisionFromStorageOperation.Interface
{
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
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ) {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const transformer = createTransformer<T>({
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry,
            fieldIndexRegistry: this.fieldIndexRegistry,
            compressionHandler: this.compressionHandler,
            valuesModifiers: this.valuesModifiers
        });
        const { entry, storageEntry } = transformer.transformEntryKeys();

        const revisionKeys = createEntryRevisionKeys(entry);
        const latestKeys = createEntryLatestKeys(entry);
        const publishedKeys = createEntryPublishedKeys(entry);

        // We'll need this flag below.
        const isPublished = entry.status === "published";

        const esLatestData = await transformer.getElasticsearchLatestEntryData();

        const entityBatch = this.entity.createEntityWriter({
            put: [
                {
                    ...revisionKeys,
                    data: storageEntry
                },
                {
                    ...latestKeys,
                    data: storageEntry
                }
            ]
        });

        if (isPublished) {
            entityBatch.put({
                ...publishedKeys,
                data: storageEntry
            });

            // Unpublish previously published revision (if any).
            const [publishedRevisionStorageEntry] =
                await this.dataLoaders.getPublishedRevisionByEntryId({
                    model,
                    ids: [entry.id]
                });

            if (publishedRevisionStorageEntry) {
                const publishedRevisionKey = createEntryRevisionKeys(publishedRevisionStorageEntry);
                entityBatch.put({
                    ...publishedRevisionKey,
                    data: {
                        ...publishedRevisionStorageEntry,
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                    }
                });
            }
        }

        try {
            await entityBatch.execute();

            this.dataLoaders.clearAll({
                tenant: entry.tenant
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create revision from given entry in the DynamoDB table.",
                ex.code || "CREATE_REVISION_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }

        const configurations = createConfigurations(this.indexProvider);
        const { index: esIndex } = await configurations.es({
            model
        });

        const elasticsearchEntityBatch = this.esEntity.createEntityWriter({
            put: [
                {
                    ...latestKeys,
                    index: esIndex,
                    data: esLatestData
                }
            ]
        });

        if (isPublished) {
            const esPublishedData = await transformer.getElasticsearchPublishedEntryData();
            elasticsearchEntityBatch.put({
                ...publishedKeys,
                index: esIndex,
                data: esPublishedData
            });
        }

        try {
            await elasticsearchEntityBatch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update latest entry in the DynamoDB Elasticsearch table.",
                ex.code || "CREATE_REVISION_ERROR",
                {
                    error: ex,
                    entry
                }
            );
        }
        /**
         * There are no modifications on the entry created so just return the data.
         */
        return initialStorageEntry;
    }
}

export const DdbEsCreateEntryRevisionFrom =
    CreateEntryRevisionFromStorageOperation.createImplementation({
        implementation: DdbEsCreateEntryRevisionFromImpl,
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
