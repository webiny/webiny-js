import {
    createListDeletedEntries,
    createListLatestEntries,
    createListNotPublishedEntries,
    createListPublishedEntries,
    createMoveEntryToTrash,
    createPublishEntry,
    createRestoreEntryFromTrash,
    createUnpublishEntry
} from "~/useCases/index.js";

export const createBulkActionEntriesTasks = () => {
    return [
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
