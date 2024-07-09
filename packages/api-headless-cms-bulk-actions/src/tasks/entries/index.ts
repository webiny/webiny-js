import { createDeleteEntriesTask } from "./deleteEntriesTask";
import { createDeleteEntriesByModelTask } from "./deleteEntriesByModelTask";
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
import { createUnpublishEntriesByModelTask } from "./unpublishEntriesByModelTask";

export * from "./gateways";
export * from "./useCases";

export const createEntriesTasks = () => {
    return [
        createDeleteEntriesTask(),
        createDeleteEntriesByModelTask(),
        createEmptyTrashBinsTask(),
        createPublishEntriesByModelTask(),
        createPublishEntriesTask(),
        createUnpublishEntriesByModelTask(),
        createUnpublishEntriesTask(),
        createMoveEntriesToFolderTask(),
        createMoveEntriesToFolderByModelTask(),
        createMoveEntriesToTrashTask(),
        createMoveEntriesToTrashByModelTask(),
        createRestoreEntriesFromTrashTask(),
        createRestoreEntriesFromTrashByModelTask()
    ];
};
