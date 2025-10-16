import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { FolderBeforeDeleteHandler } from "~/features/folders/DeleteFolder/abstractions.js";
import { FmFolderBeforeDeleteHandler } from "./FmFolderBeforeDeleteHandler.js";
import type { AcoContext } from "~/types.js";

interface LegacyDeps {
    context: AcoContext;
}

export const EnsureFmFolderIsEmptyOnDeleteFeature = createFeature({
    name: "EnsureFolderIsEmptyOnDelete",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(FolderBeforeDeleteHandler, () => {
            return new FmFolderBeforeDeleteHandler(deps.context);
        });
    }
});
