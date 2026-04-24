import { createFeature } from "@webiny/feature/api";
import { ExportContentEntriesTask } from "./ExportContentEntriesTask.js";

export const ExportContentEntriesTaskFeature = createFeature({
    name: "HeadlessCms/ImportExport/ExportContentEntriesTask",
    register(container) {
        container.register(ExportContentEntriesTask);
    }
});
