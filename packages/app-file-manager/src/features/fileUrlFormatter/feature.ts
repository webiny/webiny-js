import { createFeature } from "@webiny/feature/admin";
import FileUrlFormatterImpl from "./FileUrlFormatter.js";

export const FileUrlFormatterFeature = createFeature({
    name: "FileManager/FileUrlFormatter",
    register(container) {
        container.register(FileUrlFormatterImpl).inSingletonScope();
    }
});
