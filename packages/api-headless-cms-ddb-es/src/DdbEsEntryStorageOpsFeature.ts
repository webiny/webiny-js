import { createFeature } from "@webiny/feature/api/index.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import {
    CmsEntryOpenSearchFieldIndexRegistry,
    CmsEntryOpenSearchValuesModifier
} from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { createEntriesStorageOperations } from "~/operations/entry/index.js";
import type { CmsEntryStorageOperations } from "~/types.js";
import { CreateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { CreateEntryRevisionFromStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { UpdateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { DeleteEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { DeleteEntryRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryRevisionStorageOperation.js";
import { DeleteMultipleEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.js";
import { MoveToBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveToBinStorageOperation.js";
import { RestoreFromBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/RestoreFromBinStorageOperation.js";
import { PublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
import { UnpublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UnpublishEntryStorageOperation.js";
import { MoveEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveEntryStorageOperation.js";
import { GetEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntryStorageOperation.js";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { GetEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.js";
import { GetLatestEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetLatestEntriesByIdsStorageOperation.js";
import { GetPublishedEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPublishedEntriesByIdsStorageOperation.js";
import { GetRevisionsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionsStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { GetPreviousRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPreviousRevisionStorageOperation.js";
import { GetUniqueFieldValuesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";

export const DdbEsEntryStorageOpsFeature = createFeature({
    name: "cms.ddbEs.entryStorageOps",
    register: container => {
        let entries: CmsEntryStorageOperations | undefined;

        const ops = (): CmsEntryStorageOperations => {
            if (!entries) {
                const entryEntity = container.resolve(CmsDdbEsEntryEntity);
                const entriesEsEntity = container.resolve(CmsDdbEsEntriesEsEntity);
                const openSearchClient = container.resolve(OpenSearchClient);

                entries = createEntriesStorageOperations({
                    entity: entryEntity,
                    esEntity: entriesEsEntity,
                    elasticsearch: openSearchClient.use(),
                    container,
                    fieldRegistry: container.resolve(CmsModelFieldToGraphQLRegistry),
                    fieldIndexRegistry: container.resolve(CmsEntryOpenSearchFieldIndexRegistry),
                    compressionHandler: container.resolve(CompressionHandler),
                    valuesModifiers: container.resolveAll(CmsEntryOpenSearchValuesModifier)
                });
            }
            return entries;
        };

        container.registerFactory(CreateEntryStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["create"]>) =>
                ops().create(...args)
        }));
        container.registerFactory(CreateEntryRevisionFromStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["createRevisionFrom"]>) =>
                ops().createRevisionFrom(...args)
        }));
        container.registerFactory(UpdateEntryStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["update"]>) =>
                ops().update(...args)
        }));
        container.registerFactory(DeleteEntryStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["delete"]>) =>
                ops().delete(...args)
        }));
        container.registerFactory(DeleteEntryRevisionStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["deleteRevision"]>) =>
                ops().deleteRevision(...args)
        }));
        container.registerFactory(DeleteMultipleEntriesStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["deleteMultipleEntries"]>) =>
                ops().deleteMultipleEntries(...args)
        }));
        container.registerFactory(MoveToBinStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["moveToBin"]>) =>
                ops().moveToBin(...args)
        }));
        container.registerFactory(RestoreFromBinStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["restoreFromBin"]>) =>
                ops().restoreFromBin(...args)
        }));
        container.registerFactory(PublishEntryStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["publish"]>) =>
                ops().publish(...args)
        }));
        container.registerFactory(UnpublishEntryStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["unpublish"]>) =>
                ops().unpublish(...args)
        }));
        container.registerFactory(MoveEntryStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["move"]>) =>
                ops().move(...args)
        }));
        container.registerFactory(GetEntryStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["get"]>) =>
                ops().get(...args)
        }));
        container.registerFactory(ListEntriesStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["list"]>) =>
                ops().list(...args)
        }));
        container.registerFactory(GetEntriesByIdsStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["getByIds"]>) =>
                ops().getByIds(...args)
        }));
        container.registerFactory(GetLatestEntriesByIdsStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["getLatestByIds"]>) =>
                ops().getLatestByIds(...args)
        }));
        container.registerFactory(GetPublishedEntriesByIdsStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["getPublishedByIds"]>) =>
                ops().getPublishedByIds(...args)
        }));
        container.registerFactory(GetRevisionsStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["getRevisions"]>) =>
                ops().getRevisions(...args)
        }));
        container.registerFactory(GetRevisionByIdStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["getRevisionById"]>) =>
                ops().getRevisionById(...args)
        }));
        container.registerFactory(GetPublishedRevisionByEntryIdStorageOperation, () => ({
            execute: (
                ...args: Parameters<CmsEntryStorageOperations["getPublishedRevisionByEntryId"]>
            ) => ops().getPublishedRevisionByEntryId(...args)
        }));
        container.registerFactory(GetLatestRevisionByEntryIdStorageOperation, () => ({
            execute: (
                ...args: Parameters<CmsEntryStorageOperations["getLatestRevisionByEntryId"]>
            ) => ops().getLatestRevisionByEntryId(...args)
        }));
        container.registerFactory(GetPreviousRevisionStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["getPreviousRevision"]>) =>
                ops().getPreviousRevision(...args)
        }));
        container.registerFactory(GetUniqueFieldValuesStorageOperation, () => ({
            execute: (...args: Parameters<CmsEntryStorageOperations["getUniqueFieldValues"]>) =>
                ops().getUniqueFieldValues(...args)
        }));
    }
});
