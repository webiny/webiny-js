import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { ListFoldersUseCase } from "./ListFoldersUseCase.js";
import { ListFoldersUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import type { AcoFolderStorageOperations } from "~/types.js";
import { ListFoldersWithFolderLevelPermissions } from "./decorators/ListFoldersWithFolderLevelPermissions.js";

interface LegacyDeps {
    storageOperations: AcoFolderStorageOperations;
}

export const ListFoldersFeature = createFeature({
    name: "ListFolders",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            const folderLevelPermissions = container.resolve(FolderLevelPermissions);
            const baseUseCase = new ListFoldersUseCase(deps.storageOperations);

            return new ListFoldersWithFolderLevelPermissions(
                folderLevelPermissions,
                baseUseCase
            );
        });
    }
});
