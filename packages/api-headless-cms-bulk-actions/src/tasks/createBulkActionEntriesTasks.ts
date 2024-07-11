import { createBulkAction } from "~/plugins";
import {
    createDeleteEntry,
    createListDeletedEntries,
    createListLatestEntries,
    createListPublishedEntries,
    createMoveEntryToFolder,
    createMoveEntryToTrash,
    createPublishEntry,
    createRestoreEntryFromTrash,
    createUnpublishEntry
} from "~/implementations";

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
            dataLoader: createListLatestEntries,
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
