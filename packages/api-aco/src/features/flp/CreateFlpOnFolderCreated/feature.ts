import { createFeature } from "@webiny/feature/api";
import { CreateFlpOnFolderCreatedHandler } from "./CreateFlpOnFolderCreatedHandler.js";

export const CreateFlpOnFolderCreatedFeature = createFeature({
    name: "CreateFlpOnFolderCreated",
    register(container) {
        container.register(CreateFlpOnFolderCreatedHandler);
    }
});
