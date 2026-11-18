import { createFeature } from "@webiny/feature/api";
import { S3FileContentsStorage } from "./S3FileContentsStorage.js";

/** Writes (and cleans up) file bytes in the bucket, for `StoreFileUseCase`. */
export const FileContentsStorageFeature = createFeature({
    name: "FileManagerS3/FileContentsStorage",
    register(container) {
        container.register(S3FileContentsStorage).inSingletonScope();
    }
});
