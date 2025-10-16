import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { FolderBeforeDeleteHandler } from "~/features/folders/DeleteFolder/abstractions.js";
import { ModelFolderBeforeDeleteHandler } from "./ModelFolderBeforeDeleteHandler.js";
import type { AcoContext } from "~/types.js";

interface LegacyDeps {
    context: AcoContext;
}

export const EnsureHcmsFolderIsEmptyOnDeleteFeature = createFeature({
    name: "EnsureHcmsFolderIsEmptyOnDelete",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(FolderBeforeDeleteHandler, () => {
            return new ModelFolderBeforeDeleteHandler(deps.context);
        });
    }
});
