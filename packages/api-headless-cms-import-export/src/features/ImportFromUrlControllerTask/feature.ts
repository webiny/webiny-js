import { createFeature } from "@webiny/feature/api";
import { ImportFromUrlControllerTask } from "./ImportFromUrlControllerTask.js";

export const ImportFromUrlControllerTaskFeature = createFeature({
    name: "HeadlessCms/ImportExport/ImportFromUrlControllerTask",
    register(container) {
        container.register(ImportFromUrlControllerTask);
    }
});
