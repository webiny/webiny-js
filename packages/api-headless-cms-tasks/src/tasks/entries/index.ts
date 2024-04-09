import { createDeleteTrashBinEntriesTask } from "./deleteTrashBinEntriesTask";
import { createEmptyTrashBinByModelTask } from "./emptyTrashBinByModelTask";
import { createEmptyTrashBinsTask } from "./emptyTrashBinsTask";

export const createEntriesTasks = () => {
    return [
        createDeleteTrashBinEntriesTask(),
        createEmptyTrashBinByModelTask(),
        createEmptyTrashBinsTask()
    ];
};
