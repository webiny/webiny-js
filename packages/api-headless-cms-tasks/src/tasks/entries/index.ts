import { createDeleteEntriesTask } from "./deleteEntriesTask";
import { createEmptyTrashBinByModelTask } from "./emptyTrashBinByModelTask";
import { createEmptyTrashBinsTask } from "./emptyTrashBinsTask";
import { createPublishEntriesTask } from "./publishEntriesTask";
import { createPublishEntriesByModelTask } from "./publishEntriesByModelTask";
import { createUnpublishEntriesTask } from "./unpublishEntriesTask";
import { createMoveEntriesToFolderTask } from "./moveEntriesToFolderTask";
import { createMoveEntriesToTrashTask } from "./moveEntriesToTrashTask";
import { createRestoreEntriesFromTrashTask } from "./restoreEntriesFromTrashTask";

export * from "./useCases";
export * from "./domain";

export const createEntriesTasks = () => {
    return [
        createDeleteEntriesTask(),
        createEmptyTrashBinByModelTask(),
        createEmptyTrashBinsTask(),
        createPublishEntriesByModelTask(),
        createPublishEntriesTask(),
        createUnpublishEntriesTask(),
        createMoveEntriesToFolderTask(),
        createMoveEntriesToTrashTask(),
        createRestoreEntriesFromTrashTask()
    ];
};
