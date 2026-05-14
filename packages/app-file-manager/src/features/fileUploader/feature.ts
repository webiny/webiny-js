import { createFeature } from "@webiny/feature/admin";
import { FileUploader as Abstraction } from "./abstractions.js";
import { FileUploader } from "./FileUploader.js";

export const FileUploaderFeature = createFeature({
    name: "FileManager/FileUploader",
    register(container) {
        container.register(FileUploader).inSingletonScope();
    },
    resolve(container) {
        return {
            uploader: container.resolve(Abstraction)
        };
    }
});
