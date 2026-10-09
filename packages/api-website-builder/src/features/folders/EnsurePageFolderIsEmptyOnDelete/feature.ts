import { createFeature } from "@webiny/feature/api";
import { EnsurePageFolderIsEmptyOnDelete } from "./EnsurePageFolderIsEmptyOnDelete.js";

export const EnsurePageFolderIsEmptyOnDeleteFeature = createFeature({
    name: "Wb/EnsurePageFolderIsEmptyOnDelete",
    register(container) {
        container.register(EnsurePageFolderIsEmptyOnDelete);
    }
});
