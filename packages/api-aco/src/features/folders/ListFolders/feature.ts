import { createFeature } from "@webiny/feature";
import type { Container } from "@webiny/di-container";
import { ListFoldersUseCase } from "./ListFoldersUseCase.js";
import { ListFoldersUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { FolderLevelPermissions } from "~/flp/index.js";
import type { AcoFolderStorageOperations } from "~/types.js";
import { ListFoldersWithFolderLevelPermissions } from "./decorators/ListFoldersWithFolderLevelPermissions.js";

interface LegacyDeps {
    storageOperations: AcoFolderStorageOperations;
    folderLevelPermissions: FolderLevelPermissions;
}

export const ListFoldersFeature = createFeature({
    name: "ListFolders",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            const baseUseCase = new ListFoldersUseCase(deps.storageOperations);

            return new ListFoldersWithFolderLevelPermissions(
                deps.folderLevelPermissions,
                baseUseCase
            );
        });
    }
});
