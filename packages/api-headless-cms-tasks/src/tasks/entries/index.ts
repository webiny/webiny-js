import { createDeleteTrashBinEntriesTask } from "./deleteTrashBinEntries";
import { createEmptyTrashBinByModelTask } from "./emptyTrashBinByModelTask";
import { createEmptyTrashBinsTask } from "./emptyTrashBins";

export const createEntriesTasks = () => {
    return [
        createDeleteTrashBinEntriesTask(),
        createEmptyTrashBinByModelTask(),
        createEmptyTrashBinsTask()
    ];
};
