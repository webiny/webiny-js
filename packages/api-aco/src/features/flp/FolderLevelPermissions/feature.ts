import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { FolderLevelPermissions } from "./FolderLevelPermissions.js";

export const FolderLevelPermissionsFeature = createFeature({
    name: "FolderLevelPermissions",
    register(container: Container) {
        container.register(FolderLevelPermissions);
    }
});
