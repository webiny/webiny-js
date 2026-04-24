import { createFeature } from "@webiny/feature/api";
import { EnsureFolderIsEmptyBeforeDelete } from "./EnsureFolderIsEmptyBeforeDelete.js";

export const EnsureFolderIsEmptyBeforeDeleteFeature = createFeature({
    name: "EnsureFolderIsEmptyBeforeDelete",
    register(container) {
        container.register(EnsureFolderIsEmptyBeforeDelete);
    }
});
