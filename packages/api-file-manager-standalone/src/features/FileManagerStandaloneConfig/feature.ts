import { createFeature } from "@webiny/feature/api";
import { FileManagerStandaloneConfig } from "./FileManagerStandaloneConfig.js";

export const FileManagerStandaloneConfigFeature = createFeature({
    name: "FileManagerServer/Config",
    register(container) {
        container.register(FileManagerStandaloneConfig);
    }
});
