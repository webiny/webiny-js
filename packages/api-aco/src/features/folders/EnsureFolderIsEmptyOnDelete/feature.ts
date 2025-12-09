import { createFeature } from "@webiny/feature/api";
import { GenericFolderBeforeDeleteHandler } from "./GenericFolderBeforeDeleteHandler.js";

/**
 * This feature checks whether a folder is allowed to be deleted.
 * This generic check simply checks if there are child folders within the given folder.
 * Actual content cannot be checked, as folders do not have information about their records.
 * Individual apps (like File Manager, Headless CMS, etc.) need to implement their own event handlers.
 */
export const EnsureFolderIsEmptyOnDeleteFeature = createFeature({
    name: "EnsureFolderIsEmptyOnDelete",
    register(container) {
        container.register(GenericFolderBeforeDeleteHandler);
    }
});
