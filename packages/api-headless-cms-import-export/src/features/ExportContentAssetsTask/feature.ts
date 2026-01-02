import { createFeature } from "@webiny/feature/api";
import { ExportContentAssetsTask } from "./ExportContentAssetsTask.js";

export const ExportContentAssetsTaskFeature = createFeature({
    name: "HeadlessCms/ImportExport/ExportContentAssetsTask",
    register(container) {
        container.register(ExportContentAssetsTask);
    }
});
