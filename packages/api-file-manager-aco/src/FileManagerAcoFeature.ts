import { type Container, createFeature } from "@webiny/feature/api";
import { EnsureFolderIsEmptyBeforeDeleteFeature } from "./features/EnsureFolderIsEmptyBeforeDelete/feature.js";
import { FmFolderPermissions } from "./features/FmFolderPermissions/FmFolderPermissions.js";

export const FileManagerAcoFeature = createFeature({
    name: "FileManagerAco",
    register(container: Container) {
        // Pure DI registration — no legacy ContextPlugin bridge needed.
        EnsureFolderIsEmptyBeforeDeleteFeature.register(container);
        // File Manager folders require File Manager file access.
        container.register(FmFolderPermissions);
    }
});
