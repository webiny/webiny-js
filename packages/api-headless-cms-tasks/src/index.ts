import {
    createEmptyTrashBinsTask,
    createHcmsBulkActions
} from "@webiny/api-headless-cms-bulk-actions";
import { createHeadlessCmsImportExport } from "@webiny/api-headless-cms-import-export";
import { createDeleteModelTask } from "~/tasks/deleteModel/index.js";

export { createDeleteModelTask };

export const createHcmsTasks = () => [
    createHcmsBulkActions(),
    createEmptyTrashBinsTask(),
    createHeadlessCmsImportExport(),
    createDeleteModelTask()
];
