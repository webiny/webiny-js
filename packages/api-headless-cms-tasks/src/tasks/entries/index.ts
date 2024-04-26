import { createDeleteTrashBinEntriesTask } from "./deleteTrashBinEntriesTask";
import { createEmptyTrashBinByModelTask } from "./emptyTrashBinByModelTask";
import { createEmptyTrashBinsTask } from "./emptyTrashBinsTask";
import { createPublishEntriesTask } from "./publishEntriesTask";
import { createPublishEntriesByModelTask } from "./publishEntriesByModelTask";

export * from "./useCases";
export * from "./domain";

export const createEntriesTasks = () => {
    return [
        createDeleteTrashBinEntriesTask(),
        createEmptyTrashBinByModelTask(),
        createEmptyTrashBinsTask(),
        createPublishEntriesByModelTask(),
        createPublishEntriesTask()
    ];
};
