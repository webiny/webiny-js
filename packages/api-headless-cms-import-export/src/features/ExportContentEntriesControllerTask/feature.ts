import { createFeature } from "@webiny/feature/api";
import { ExportContentEntriesControllerTask } from "./ExportContentEntriesControllerTask.js";

export const ExportContentEntriesControllerTaskFeature = createFeature({
    name: "HeadlessCms/ImportExport/ExportContentEntriesControllerTask",
    register(container) {
        container.register(ExportContentEntriesControllerTask);
    }
});
