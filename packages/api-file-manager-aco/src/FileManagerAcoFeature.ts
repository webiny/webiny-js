import { type Container, createFeature } from "@webiny/feature/api";
import { EnsureFolderIsEmptyBeforeDeleteFeature } from "./features/EnsureFolderIsEmptyBeforeDelete/feature.js";

export const FileManagerAcoFeature = createFeature({
    name: "FileManagerAco",
    register(container: Container) {
        // Pure DI registration — no legacy ContextPlugin bridge needed.
        EnsureFolderIsEmptyBeforeDeleteFeature.register(container);
    }
});
