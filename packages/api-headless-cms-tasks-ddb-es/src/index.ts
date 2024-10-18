import {
    createBulkAction,
    createDeleteEntry,
    createEmptyTrashBinsTask,
    createHcmsBulkActions,
    createListDeletedEntries,
    createListLatestEntries,
    createListNotPublishedEntries,
    createListPublishedEntries,
    createMoveEntryToFolder,
    createMoveEntryToTrash,
    createPublishEntry,
    createRestoreEntryFromTrash,
    createUnpublishEntry
} from "@webiny/api-headless-cms-bulk-actions";
import { createHeadlessCmsImportExport } from "@webiny/api-headless-cms-import-export";

const createEsBulkActionEntriesTasks = () => {
    return [
        createBulkAction({
            name: "delete",
            dataLoader: createListDeletedEntries,
            dataProcessor: createDeleteEntry,
            batchSize: 1000
        }),
        createBulkAction({
            name: "moveToFolder",
            dataLoader: createListLatestEntries,
            dataProcessor: createMoveEntryToFolder,
            batchSize: 1000
        }),
        createBulkAction({
            name: "moveToTrash",
            dataLoader: createListLatestEntries,
            dataProcessor: createMoveEntryToTrash,
            batchSize: 1000
        }),
        createBulkAction({
            name: "publish",
            dataLoader: createListNotPublishedEntries,
            dataProcessor: createPublishEntry,
            batchSize: 1000
        }),
        createBulkAction({
            name: "unpublish",
            dataLoader: createListPublishedEntries,
            dataProcessor: createUnpublishEntry,
            batchSize: 1000
        }),
        createBulkAction({
            name: "restore",
            dataLoader: createListDeletedEntries,
            dataProcessor: createRestoreEntryFromTrash,
            batchSize: 1000
        })
    ];
};

export const createHcmsTasks = () => [
    createHcmsBulkActions(),
    createEsBulkActionEntriesTasks(),
    createEmptyTrashBinsTask(),
    createHeadlessCmsImportExport()
];
