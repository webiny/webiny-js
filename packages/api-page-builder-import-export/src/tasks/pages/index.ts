import { createExportPagesControllerTask } from "./exportPagesControllerTask";
import { createImportPagesControllerTask } from "./importPagesControllerTask";
import { createExportPagesZipPagesTask } from "./exportPagesZipPagesTask";
import { createExportPagesCombineZippedPagesTask } from "./exportPagesCombineZippedPagesTask";

export const createPagesTasks = () => {
    return [
        createExportPagesControllerTask(),
        createExportPagesZipPagesTask(),
        createExportPagesCombineZippedPagesTask(),
        createImportPagesControllerTask()
    ];
};
