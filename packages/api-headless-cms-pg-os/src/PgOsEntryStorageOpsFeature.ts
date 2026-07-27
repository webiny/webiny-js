import { createFeature } from "@webiny/feature/api/index.js";
import { SqlEntryOperations } from "@webiny/api-headless-cms-sql/operations/entry/abstractions/SqlEntryOperations.js";
import { EntryWriteOperations } from "~/operations/entry/abstractions/EntryWriteOperations.js";
import { EntrySearchOperations } from "~/operations/entry/abstractions/EntrySearchOperations.js";
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

export const PgOsEntryStorageOpsFeature = createFeature({
    name: "cms.pgOs.entryStorageOps",
    register: container => {
        const writeOps = () => container.resolve(EntryWriteOperations);
        const searchOps = () => container.resolve(EntrySearchOperations);
        const sqlOps = () => container.resolve(SqlEntryOperations);

        // Write ops (11) — from EntryWriteOperations
        container.registerFactory(CreateEntryStorageOperation, () => ({
            execute: (...args: Parameters<EntryWriteOperations.Interface["create"]>) =>
                writeOps().create(...args)
        }));
        container.registerFactory(CreateEntryRevisionFromStorageOperation, () => ({
            execute: (...args: Parameters<EntryWriteOperations.Interface["createRevisionFrom"]>) =>
                writeOps().createRevisionFrom(...args)
        }));
        container.registerFactory(UpdateEntryStorageOperation, () => ({
            execute: (...args: Parameters<EntryWriteOperations.Interface["update"]>) =>
                writeOps().update(...args)
        }));
        container.registerFactory(PublishEntryStorageOperation, () => ({
            execute: (...args: Parameters<EntryWriteOperations.Interface["publish"]>) =>
                writeOps().publish(...args)
        }));
        container.registerFactory(UnpublishEntryStorageOperation, () => ({
            execute: (...args: Parameters<EntryWriteOperations.Interface["unpublish"]>) =>
                writeOps().unpublish(...args)
        }));
        container.registerFactory(MoveEntryStorageOperation, () => ({
            execute: (...args: Parameters<EntryWriteOperations.Interface["move"]>) =>
                writeOps().move(...args)
        }));
        container.registerFactory(MoveToBinStorageOperation, () => ({
            execute: (...args: Parameters<EntryWriteOperations.Interface["moveToBin"]>) =>
                writeOps().moveToBin(...args)
        }));
        container.registerFactory(RestoreFromBinStorageOperation, () => ({
            execute: (...args: Parameters<EntryWriteOperations.Interface["restoreFromBin"]>) =>
                writeOps().restoreFromBin(...args)
        }));
        container.registerFactory(DeleteEntryStorageOperation, () => ({
            execute: (...args: Parameters<EntryWriteOperations.Interface["delete"]>) =>
                writeOps().delete(...args)
        }));
        container.registerFactory(DeleteEntryRevisionStorageOperation, () => ({
            execute: (...args: Parameters<EntryWriteOperations.Interface["deleteRevision"]>) =>
                writeOps().deleteRevision(...args)
        }));
        container.registerFactory(DeleteMultipleEntriesStorageOperation, () => ({
            execute: (
                ...args: Parameters<EntryWriteOperations.Interface["deleteMultipleEntries"]>
            ) => writeOps().deleteMultipleEntries(...args)
        }));

        // Search ops (3) — from EntrySearchOperations
        container.registerFactory(GetEntryStorageOperation, () => ({
            execute: (...args: Parameters<EntrySearchOperations.Interface["get"]>) =>
                searchOps().get(...args)
        }));
        container.registerFactory(ListEntriesStorageOperation, () => ({
            execute: (...args: Parameters<EntrySearchOperations.Interface["list"]>) =>
                searchOps().list(...args)
        }));
        container.registerFactory(GetUniqueFieldValuesStorageOperation, () => ({
            execute: (
                ...args: Parameters<EntrySearchOperations.Interface["getUniqueFieldValues"]>
            ) => searchOps().getUniqueFieldValues(...args)
        }));

        // SQL ops (8) — from SqlEntryOperations
        container.registerFactory(GetRevisionsStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getRevisions"]>) =>
                sqlOps().getRevisions(...args)
        }));
        container.registerFactory(GetRevisionByIdStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getRevisionById"]>) =>
                sqlOps().getRevisionById(...args)
        }));
        container.registerFactory(GetEntriesByIdsStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getByIds"]>) =>
                sqlOps().getByIds(...args)
        }));
        container.registerFactory(GetLatestEntriesByIdsStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getLatestByIds"]>) =>
                sqlOps().getLatestByIds(...args)
        }));
        container.registerFactory(GetPublishedEntriesByIdsStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getPublishedByIds"]>) =>
                sqlOps().getPublishedByIds(...args)
        }));
        container.registerFactory(GetLatestRevisionByEntryIdStorageOperation, () => ({
            execute: (
                ...args: Parameters<SqlEntryOperations.Interface["getLatestRevisionByEntryId"]>
            ) => sqlOps().getLatestRevisionByEntryId(...args)
        }));
        container.registerFactory(GetPublishedRevisionByEntryIdStorageOperation, () => ({
            execute: (
                ...args: Parameters<SqlEntryOperations.Interface["getPublishedRevisionByEntryId"]>
            ) => sqlOps().getPublishedRevisionByEntryId(...args)
        }));
        container.registerFactory(GetPreviousRevisionStorageOperation, () => ({
            execute: (...args: Parameters<SqlEntryOperations.Interface["getPreviousRevision"]>) =>
                sqlOps().getPreviousRevision(...args)
        }));
    }
});
