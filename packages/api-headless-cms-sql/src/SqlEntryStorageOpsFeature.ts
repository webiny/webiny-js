import { createFeature } from "@webiny/feature/api/index.js";
import { SqlEntryOperations } from "~/operations/entry/abstractions/SqlEntryOperations.js";
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

export const SqlEntryStorageOpsFeature = createFeature({
    name: "cms.sql.entryStorageOps",
    register: container => {
        const ops = () => container.resolve(SqlEntryOperations);

        container.registerFactory(CreateEntryStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["create"]>) =>
                ops().create(...args)
        }));
        container.registerFactory(CreateEntryRevisionFromStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["createRevisionFrom"]>) =>
                ops().createRevisionFrom(...args)
        }));
        container.registerFactory(UpdateEntryStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["update"]>) =>
                ops().update(...args)
        }));
        container.registerFactory(DeleteEntryStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["delete"]>) =>
                ops().delete(...args)
        }));
        container.registerFactory(DeleteEntryRevisionStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["deleteRevision"]>) =>
                ops().deleteRevision(...args)
        }));
        container.registerFactory(DeleteMultipleEntriesStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["deleteMultipleEntries"]>) =>
                ops().deleteMultipleEntries(...args)
        }));
        container.registerFactory(MoveToBinStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["moveToBin"]>) =>
                ops().moveToBin(...args)
        }));
        container.registerFactory(RestoreFromBinStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["restoreFromBin"]>) =>
                ops().restoreFromBin(...args)
        }));
        container.registerFactory(PublishEntryStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["publish"]>) =>
                ops().publish(...args)
        }));
        container.registerFactory(UnpublishEntryStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["unpublish"]>) =>
                ops().unpublish(...args)
        }));
        container.registerFactory(MoveEntryStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["move"]>) =>
                ops().move(...args)
        }));
        container.registerFactory(GetEntryStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["get"]>) =>
                ops().get(...args)
        }));
        container.registerFactory(ListEntriesStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["list"]>) =>
                ops().list(...args)
        }));
        container.registerFactory(GetEntriesByIdsStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getByIds"]>) =>
                ops().getByIds(...args)
        }));
        container.registerFactory(GetLatestEntriesByIdsStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getLatestByIds"]>) =>
                ops().getLatestByIds(...args)
        }));
        container.registerFactory(GetPublishedEntriesByIdsStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getPublishedByIds"]>) =>
                ops().getPublishedByIds(...args)
        }));
        container.registerFactory(GetRevisionsStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getRevisions"]>) =>
                ops().getRevisions(...args)
        }));
        container.registerFactory(GetRevisionByIdStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getRevisionById"]>) =>
                ops().getRevisionById(...args)
        }));
        container.registerFactory(GetPublishedRevisionByEntryIdStorageOperation, () => ({
            execute: (
                ...args: Parameters<SqlEntryOperations.Interface["getPublishedRevisionByEntryId"]>
            ) => ops().getPublishedRevisionByEntryId(...args)
        }));
        container.registerFactory(GetLatestRevisionByEntryIdStorageOperation, () => ({
            execute: (
                ...args: Parameters<SqlEntryOperations.Interface["getLatestRevisionByEntryId"]>
            ) => ops().getLatestRevisionByEntryId(...args)
        }));
        container.registerFactory(GetPreviousRevisionStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getPreviousRevision"]>) =>
                ops().getPreviousRevision(...args)
        }));
        container.registerFactory(GetUniqueFieldValuesStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getUniqueFieldValues"]>) =>
                ops().getUniqueFieldValues(...args)
        }));
    }
});
