import { createExportPagesControllerTask, createImportPagesTask } from "./pages";

export const createTasks = () => {
    return [createExportPagesControllerTask(), createImportPagesTask()];
};
