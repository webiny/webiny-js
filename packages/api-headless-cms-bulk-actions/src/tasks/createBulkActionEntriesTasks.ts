import {
    createListDeletedEntries,
    createListPublishedEntries,
    createRestoreEntryFromTrash,
    createUnpublishEntry
} from "~/useCases/index.js";

export const createBulkActionEntriesTasks = () => {
    return [
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
