import { createBulkAction } from "~/plugins";
import {
    createDeleteEntry,
    createListDeletedEntries,
    createListLatestEntries,
    createListNotPublishedEntries,
    createListPublishedEntries,
    createMoveEntryToFolder,
    createMoveEntryToTrash,
    createPublishEntry,
    createRestoreEntryFromTrash,
    createUnpublishEntry
} from "~/useCases";

export const createBulkActionEntriesTasks = () => {
    return [
        createBulkAction({
            name: "delete",
            dataLoader: createListDeletedEntries,
            dataProcessor: createDeleteEntry
        }),
        createBulkAction({
            name: "moveToFolder",
            dataLoader: createListLatestEntries,
            dataProcessor: createMoveEntryToFolder
        }),
        createBulkAction({
            name: "moveToTrash",
            dataLoader: createListLatestEntries,
            dataProcessor: createMoveEntryToTrash
        }),
        createBulkAction({
            name: "publish",
            dataLoader: createListNotPublishedEntries,
            dataProcessor: createPublishEntry
        }),
        createBulkAction({
            name: "unpublish",
            dataLoader: createListPublishedEntries,
            dataProcessor: createUnpublishEntry
        }),
        createBulkAction({
            name: "restore",
            dataLoader: createListDeletedEntries,
            dataProcessor: createRestoreEntryFromTrash
        })
    ];
};
