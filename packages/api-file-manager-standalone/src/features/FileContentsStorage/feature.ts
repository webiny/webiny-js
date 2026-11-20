import { createFeature } from "@webiny/feature/api";
import { DiskFileContentsStorage } from "./DiskFileContentsStorage.js";

/** Writes (and cleans up) file bytes on disk, for `StoreFileUseCase`. */
export const FileContentsStorageFeature = createFeature({
    name: "FileManagerServer/FileContentsStorage",
    register(container) {
        container.register(DiskFileContentsStorage).inSingletonScope();
    }
});
