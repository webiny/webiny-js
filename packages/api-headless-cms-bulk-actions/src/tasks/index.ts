import { createBulkActionEntriesTasks } from "./createBulkActionEntriesTasks";
import { createEmptyTrashBinsTask } from "./createEmptyTrashBinsTask";

export const createTasks = () => {
    return [createBulkActionEntriesTasks(), createEmptyTrashBinsTask()];
};
