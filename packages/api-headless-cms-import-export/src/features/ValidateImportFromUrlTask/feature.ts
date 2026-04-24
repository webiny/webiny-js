import { createFeature } from "@webiny/feature/api";
import { ValidateImportFromUrlTask } from "./ValidateImportFromUrlTask.js";

export const ValidateImportFromUrlTaskFeature = createFeature({
    name: "HeadlessCms/ImportExport/ValidateImportFromUrlTask",
    register(container) {
        container.register(ValidateImportFromUrlTask);
    }
});
