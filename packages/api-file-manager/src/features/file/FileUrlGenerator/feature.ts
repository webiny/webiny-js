import { createFeature } from "@webiny/feature/api";
import { FileUrlGenerator } from "./FileUrlGenerator.js";

export const FileUrlGeneratorFeature = createFeature({
    name: "FileManager/FileUrlGenerator",
    register(container) {
        container.register(FileUrlGenerator).inSingletonScope();
    }
});
