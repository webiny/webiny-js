import { createFeature } from "@webiny/feature/api";
import { ImportFromUrlControllerTask } from "./ImportFromUrlControllerTask.js";

export const ImportFromUrlControllerTaskFeature = createFeature({
    name: "headlessCmsImportExport.importFromUrlControllerTask",
    register(container) {
        container.register(ImportFromUrlControllerTask);
    }
});
