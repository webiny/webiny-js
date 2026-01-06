import { createFeature } from "@webiny/feature/api";
import { DeleteFileFromBucketHandler } from "./DeleteFileFromBucketHandler.js";
import { DeleteS3FolderTaskDefinition } from "./DeleteS3FolderTask.js";

export const DeleteFileFromBucketFeature = createFeature({
    name: "FileManagerS3/DeleteFileFromBucket",
    register(container) {
        container.register(DeleteFileFromBucketHandler);
        container.register(DeleteS3FolderTaskDefinition);
    }
});
