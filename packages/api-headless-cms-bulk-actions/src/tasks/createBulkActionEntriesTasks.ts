import { createListDeletedEntries, createRestoreEntryFromTrash } from "~/useCases/index.js";

export const createBulkActionEntriesTasks = () => {
    return [
        createBulkAction({
            name: "restore",
            dataLoader: createListDeletedEntries,
            dataProcessor: createRestoreEntryFromTrash
        })
    ];
};
