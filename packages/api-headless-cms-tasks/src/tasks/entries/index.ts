import { createDeleteTrashBinEntriesTask } from "./deleteTrashBinEntriesTask";
import { createEmptyTrashBinByModelTask } from "./emptyTrashBinByModelTask";
import { createEmptyTrashBinsTask } from "./emptyTrashBinsTask";
import { createPublishEntriesTask } from "./publishEntriesTask";
import { createPublishEntriesByModelTask } from "./publishEntriesByModelTask";
import { createUnpublishEntriesTask } from "./unpublishEntriesTask";
import { createMoveEntriesToFolderTask } from "./moveEntriesToFolderTask";

export * from "./useCases";
export * from "./domain";

export const createEntriesTasks = () => {
    return [
        createDeleteTrashBinEntriesTask(),
        createEmptyTrashBinByModelTask(),
        createEmptyTrashBinsTask(),
        createPublishEntriesByModelTask(),
        createPublishEntriesTask(),
        createUnpublishEntriesTask(),
        createMoveEntriesToFolderTask()
    ];
};
