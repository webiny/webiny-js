import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import { FileManagerStandaloneConfig } from "./abstractions.js";

export const FileManagerStandaloneConfigFeature = createFeature({
    name: "FileManagerServer/Config",
    register(container: Container, config: FileManagerStandaloneConfig.Interface) {
        container.registerInstance(FileManagerStandaloneConfig, config);
    }
});
