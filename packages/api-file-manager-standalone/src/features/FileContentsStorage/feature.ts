import { createFeature } from "@webiny/feature/api";
import { ObjectFileContentsStorage } from "./ObjectFileContentsStorage.js";

/** Writes (and cleans up) file bytes in the object storage, for `StoreFileUseCase`. */
export const FileContentsStorageFeature = createFeature({
    name: "FileManagerServer/FileContentsStorage",
    register(container) {
        container.register(ObjectFileContentsStorage).inSingletonScope();
    }
});
