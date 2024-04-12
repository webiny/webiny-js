import { createDeleteTrashBinEntriesTask } from "./deleteTrashBinEntriesTask";
import { createEmptyTrashBinByModelTask } from "./emptyTrashBinByModelTask";
import { createEmptyTrashBinsTask } from "./emptyTrashBinsTask";

export * from "./useCases";

export const createEntriesTasks = () => {
    return [
        createDeleteTrashBinEntriesTask(),
        createEmptyTrashBinByModelTask(),
        createEmptyTrashBinsTask()
    ];
};
