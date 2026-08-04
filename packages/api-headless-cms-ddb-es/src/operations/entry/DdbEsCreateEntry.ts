import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsCreateParams
} from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
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

class DdbEsCreateEntryImpl implements CreateEntryStorageOperation.Interface {
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
        params: CmsEntryStorageOperationsCreateParams<T>
    ) {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;

        const model = this.storageModelProvider.getModel<T>(initialModel);

        const isPublished = initialEntry.status === "published";
        const locked = isPublished ? true : initialEntry.locked;

        initialEntry.locked = locked;
        initialStorageEntry.locked = locked;

        const transformer = createTransformer<T>({
            fieldIndexRegistry: this.fieldIndexRegistry,
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry,
            compressionHandler: this.compressionHandler,
            valuesModifiers: this.valuesModifiers
        });

        const { entry, storageEntry } = transformer.transformEntryKeys();

        const esEntry = transformer.transformToIndex();

        const configurations = createConfigurations(this.indexProvider);
        const { index: esIndex } = await configurations.es({
            model
        });

        const revisionKeys = createEntryRevisionKeys(entry);
        const latestKeys = createEntryLatestKeys(entry);
        const publishedKeys = createEntryPublishedKeys(entry);

        const entityBatch = this.entity.createEntityWriter({
            put: [
                {
                    ...revisionKeys,
                    data: {
                        ...storageEntry,
                        locked
                    }
                },
                {
                    ...latestKeys,
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

        try {
            await entityBatch.execute();
            this.dataLoaders.clearAll({
                tenant: entry.tenant
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not insert entry data into the DynamoDB table.",
                ex.code || "CREATE_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }

        const esLatestData = await transformer.getElasticsearchLatestEntryData();

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
                ex.message || "Could not insert entry data into the Elasticsearch DynamoDB table.",
                ex.code || "CREATE_ES_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    esEntry
                }
            );
        }

        return initialStorageEntry;
    }
}

export const DdbEsCreateEntry = CreateEntryStorageOperation.createImplementation({
    implementation: DdbEsCreateEntryImpl,
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
