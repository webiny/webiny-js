import { createFeature } from "@webiny/feature/api";
import { UpdateFlpOnFolderUpdatedHandler } from "./UpdateFlpOnFolderUpdatedHandler.js";
import type { AcoContext } from "~/types.js";

export const UpdateFlpOnFolderUpdatedFeature = createFeature({
    name: "UpdateFlpOnFolderUpdated",
    register(container) {
        container.register(UpdateFlpOnFolderUpdatedHandler);
    }
});
