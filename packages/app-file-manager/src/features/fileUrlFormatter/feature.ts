import { createFeature } from "@webiny/feature/admin";
import { FmFileUrlFormatter } from "./FileUrlFormatter.js";

export const FileUrlFormatterFeature = createFeature({
    name: "FileManager/FileUrlFormatter",
    register(container) {
        container.register(FmFileUrlFormatter).inSingletonScope();
    }
});
