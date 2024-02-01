import { createExportPagesControllerTask } from "./exportPagesControllerTask";
import { createImportPagesControllerTask } from "./importPagesControllerTask";
import { createExportPagesZipPagesTask } from "./exportPagesZipPagesTask";
import { createExportPagesCleanupTask } from "./exportPagesCleanupTask";

export const createPagesTasks = () => {
    return [
        createExportPagesControllerTask(),
        createExportPagesZipPagesTask(),
        createExportPagesCleanupTask(),
        createImportPagesControllerTask()
    ];
};
