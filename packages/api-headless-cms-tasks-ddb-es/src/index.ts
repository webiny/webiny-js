import {
    createEmptyTrashBinsTask,
    createHcmsBulkActions
} from "@webiny/api-headless-cms-bulk-actions";
import { createHeadlessCmsImportExport } from "@webiny/api-headless-cms-import-export";
import { createDeleteModelTask } from "@webiny/api-headless-cms-tasks";

export const createHcmsTasks = () => {
    return [
        createHcmsBulkActions({ batchSize: 1000 }),
        createEmptyTrashBinsTask(),
        createHeadlessCmsImportExport(),
        createDeleteModelTask()
    ];
};
