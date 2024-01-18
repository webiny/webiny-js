import { createExportPagesControllerTask } from "./exportPagesControllerTask";
import { createImportPagesControllerTask } from "./importPagesControllerTask";
import { createExportPagesZipPagesTask } from "./exportPagesZipPagesTask";
import { createExportPagesCombineZippedPagesTask } from "./exportPagesCombineZippedPagesTask";
import { createExportPagesCleanupTask } from "./exportPagesCleanupTask";

export const createPagesTasks = () => {
    return [
        createExportPagesControllerTask(),
        createExportPagesZipPagesTask(),
        createExportPagesCombineZippedPagesTask(),
        createExportPagesCleanupTask(),
        createImportPagesControllerTask()
    ];
};
