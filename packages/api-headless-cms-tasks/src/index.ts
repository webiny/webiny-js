import {
    createBulkActionEntriesTasks,
    createEmptyTrashBinsTask,
    createHcmsBulkActions
} from "@webiny/api-headless-cms-bulk-actions";
import { createHeadlessCmsImportExport } from "@webiny/api-headless-cms-import-export";

export const createHcmsTasks = () => [
    createHcmsBulkActions(),
    createBulkActionEntriesTasks(),
    createEmptyTrashBinsTask(),
    createHeadlessCmsImportExport()
];
