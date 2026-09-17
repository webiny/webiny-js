import { createFeature } from "@webiny/feature/api";
import { CleanupStaleMultipartUploadsTaskDefinition } from "./CleanupStaleMultipartUploadsTask.js";

export const CleanupStaleMultipartUploadsFeature = createFeature({
    name: "FileManagerServer/CleanupStaleMultipartUploads",
    register(container) {
        container.register(CleanupStaleMultipartUploadsTaskDefinition);
    }
});
