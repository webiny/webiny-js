import { createFeature } from "@webiny/feature/api";
import { UpdateFlpOnFolderUpdatedHandler } from "./UpdateFlpOnFolderUpdatedHandler.js";

export const UpdateFlpOnFolderUpdatedFeature = createFeature({
    name: "UpdateFlpOnFolderUpdated",
    register(container) {
        container.register(UpdateFlpOnFolderUpdatedHandler);
    }
});
