import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { FolderBeforeDeleteHandler } from "~/features/folders/DeleteFolder/abstractions.js";
import { GenericFolderBeforeDeleteHandler } from "./GenericFolderBeforeDeleteHandler.js";
import type { AcoContext } from "~/types.js";

interface LegacyDeps {
    context: AcoContext;
}

/**
 * This feature checks whether a folder is allowed to be deleted.
 * This generic check simply checks if there are child folders within the given folder.
 * Actual content cannot be checked, as folders do not have information about their records.
 * Individual apps (like File Manager, Headless CMS, etc.) need to implement their own event handlers.
 */
export const EnsureFolderIsEmptyOnDeleteFeature = createFeature({
    name: "EnsureFolderIsEmptyOnDelete",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(FolderBeforeDeleteHandler, () => {
            return new GenericFolderBeforeDeleteHandler(deps.context);
        });
    }
});
