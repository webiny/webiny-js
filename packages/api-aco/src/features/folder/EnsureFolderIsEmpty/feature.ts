import { createFeature } from "@webiny/feature/api";
import { EnsureFolderIsEmpty } from "./EnsureFolderIsEmpty.js";

export const EnsureFolderIsEmptyFeature = createFeature({
    name: "EnsureFolderIsEmptyFeature",
    register(container) {
        container.register(EnsureFolderIsEmpty);
    }
});
