import { createFeature } from "@webiny/feature/api";
import { DeleteFileFromStorageHandler } from "./DeleteFileFromStorageHandler.js";

export const DeleteFileFromStorageFeature = createFeature({
    name: "FileManagerServer/DeleteFileFromStorage",
    register(container) {
        container.register(DeleteFileFromStorageHandler);
    }
});
