import { createFeature } from "@webiny/feature/api";
import { DeleteFileFromDiskHandler } from "./DeleteFileFromDiskHandler.js";

export const DeleteFileFromDiskFeature = createFeature({
    name: "FileManagerServer/DeleteFileFromDisk",
    register(container) {
        container.register(DeleteFileFromDiskHandler);
    }
});
