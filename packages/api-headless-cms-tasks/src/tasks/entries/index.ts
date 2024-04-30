import { createDeleteEntriesTask } from "./deleteEntriesTask";
import { createEmptyTrashBinByModelTask } from "./emptyTrashBinByModelTask";
import { createEmptyTrashBinsTask } from "./emptyTrashBinsTask";
import { createPublishEntriesTask } from "./publishEntriesTask";
import { createPublishEntriesByModelTask } from "./publishEntriesByModelTask";
import { createUnpublishEntriesTask } from "./unpublishEntriesTask";
import { createMoveEntriesToFolderByModelTask } from "./moveEntriesToFolderByModelTask";
import { createMoveEntriesToFolderTask } from "./moveEntriesToFolderTask";
import { createMoveEntriesToTrashTask } from "./moveEntriesToTrashTask";
import { createMoveEntriesToTrashByModelTask } from "./moveEntriesToTrashByModelTask";
import { createRestoreEntriesFromTrashTask } from "./restoreEntriesFromTrashTask";
import { createRestoreEntriesFromTrashByModelTask } from "./restoreEntriesFromTrashByModelTask";

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
        createMoveEntriesToFolderByModelTask(),
        createMoveEntriesToTrashTask(),
        createMoveEntriesToTrashByModelTask(),
        createRestoreEntriesFromTrashTask(),
        createRestoreEntriesFromTrashByModelTask()
    ];
};
