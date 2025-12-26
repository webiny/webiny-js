import { createFeature } from "@webiny/feature/api";
import { ImportFromUrlDownloadTask } from "./ImportFromUrlDownloadTask.js";

export const ImportFromUrlDownloadTaskFeature = createFeature({
    name: "HeadlessCms/ImportExport/ImportFromUrlDownloadTask",
    register(container) {
        container.register(ImportFromUrlDownloadTask);
    }
});
