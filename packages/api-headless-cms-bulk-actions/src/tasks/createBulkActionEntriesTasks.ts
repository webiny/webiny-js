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
            name: "Delete",
            dataLoader: createListDeletedEntries,
            dataProcessor: createDeleteEntry
        }),
        createBulkAction({
            name: "MoveToFolder",
            dataLoader: createListLatestEntries,
            dataProcessor: createMoveEntryToFolder
        }),
        createBulkAction({
            name: "MoveToTrash",
            dataLoader: createListLatestEntries,
            dataProcessor: createMoveEntryToTrash
        }),
        createBulkAction({
            name: "Publish",
            dataLoader: createListLatestEntries,
            dataProcessor: createPublishEntry
        }),
        createBulkAction({
            name: "Unpublish",
            dataLoader: createListPublishedEntries,
            dataProcessor: createUnpublishEntry
        }),
        createBulkAction({
            name: "Restore",
            dataLoader: createListDeletedEntries,
            dataProcessor: createRestoreEntryFromTrash
        })
    ];
};
