import { createFeature } from "@webiny/feature/api";
import { ImportFromUrlProcessEntriesTask } from "./ImportFromUrlProcessEntriesTask.js";

export const ImportFromUrlProcessEntriesTaskFeature = createFeature({
    name: "HeadlessCms/ImportExport/ImportFromUrlProcessEntriesTask",
    register(container) {
        container.register(ImportFromUrlProcessEntriesTask);
    }
});
