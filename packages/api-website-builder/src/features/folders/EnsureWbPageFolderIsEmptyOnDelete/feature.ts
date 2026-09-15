import { createFeature } from "@webiny/feature/api";
import { EnsureWbPageFolderIsEmptyOnDelete } from "./EnsureWbPageFolderIsEmptyOnDelete.js";

export const EnsureWbPageFolderIsEmptyOnDeleteFeature = createFeature({
    name: "EnsureWbPageFolderIsEmptyOnDelete",
    register(container) {
        container.register(EnsureWbPageFolderIsEmptyOnDelete);
    }
});
