import { createFeature } from "@webiny/feature/api";
import { DeleteFlpOnFolderDeletedHandler } from "./DeleteFlpOnFolderDeletedHandler.js";

export const DeleteFlpOnFolderDeletedFeature = createFeature({
    name: "DeleteFlpOnFolderDeleted",
    register(container) {
        container.register(DeleteFlpOnFolderDeletedHandler);
    }
});
