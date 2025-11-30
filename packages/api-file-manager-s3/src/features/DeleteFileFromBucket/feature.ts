import { createFeature } from "@webiny/feature/api";
import { DeleteFileFromBucketHandler } from "./DeleteFileFromBucketHandler.js";

export const DeleteFileFromBucketFeature = createFeature({
    name: "FileManagerS3/DeleteFileFromBucket",
    register(container) {
        container.register(DeleteFileFromBucketHandler);
    }
});
