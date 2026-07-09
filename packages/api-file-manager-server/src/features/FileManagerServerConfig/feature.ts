import { createFeature } from "@webiny/feature/api";
import { FileManagerServerConfig } from "./FileManagerServerConfig.js";

export const FileManagerServerConfigFeature = createFeature({
    name: "FileManagerServer/Config",
    register(container) {
        container.register(FileManagerServerConfig);
    }
});
