import { createExportPagesControllerTask } from "./exportPagesControllerTask";
import { createImportPagesControllerTask } from "./importPagesControllerTask";
import { createExportPagesZipPagesTask } from "./exportPagesZipPagesTask";
import { createExportPagesCleanupTask } from "./exportPagesCleanupTask";
import { createImportPagesProcessPagesTask } from "./importPagesProcessPageTask";

export const createPagesTasks = () => {
    return [
        createExportPagesControllerTask(),
        createExportPagesZipPagesTask(),
        createExportPagesCleanupTask(),
        createImportPagesControllerTask(),
        createImportPagesProcessPagesTask()
    ];
};
