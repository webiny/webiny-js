import { createFeature } from "@webiny/feature/api";
import { ImportFromUrlProcessAssetsTask } from "./ImportFromUrlProcessAssetsTask.js";

export const ImportFromUrlProcessAssetsTaskFeature = createFeature({
    name: "HeadlessCms/ImportExport/ImportFromUrlProcessAssetsTask",
    register(container) {
        container.register(ImportFromUrlProcessAssetsTask);
    }
});
