import { createFeature } from "@webiny/feature/api";
import { EnsureWbRedirectFolderIsEmptyOnDelete } from "./EnsureWbRedirectFolderIsEmptyOnDelete.js";

export const EnsureWbRedirectFolderIsEmptyOnDeleteFeature = createFeature({
    name: "EnsureWbRedirectFolderIsEmptyOnDelete",
    register(container) {
        container.register(EnsureWbRedirectFolderIsEmptyOnDelete);
    }
});
