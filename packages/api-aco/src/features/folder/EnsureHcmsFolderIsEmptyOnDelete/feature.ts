import { createFeature } from "@webiny/feature/api";
import { ModelFolderBeforeDeleteHandler } from "./ModelFolderBeforeDeleteHandler.js";

export const EnsureHcmsFolderIsEmptyOnDeleteFeature = createFeature({
    name: "EnsureHcmsFolderIsEmptyOnDelete",
    register(container) {
        container.register(ModelFolderBeforeDeleteHandler);
    }
});
