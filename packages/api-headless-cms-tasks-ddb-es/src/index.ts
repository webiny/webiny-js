import {
    createEmptyTrashBinsTask,
    createHcmsBulkActions
} from "@webiny/api-headless-cms-bulk-actions";
import { createDeleteModelTask } from "@webiny/api-headless-cms-tasks";

export const createHcmsTasks = () => {
    return [
        createHcmsBulkActions({ batchSize: 1000 }),
        createEmptyTrashBinsTask(),
        createDeleteModelTask()
    ];
};
