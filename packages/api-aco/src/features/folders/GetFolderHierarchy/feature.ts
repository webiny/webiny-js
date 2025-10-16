import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { GetFolderHierarchyUseCase } from "./GetFolderHierarchyUseCase.js";
import { GetFolderHierarchyUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import type { AcoFolderStorageOperations } from "~/types.js";
import { GetFolderHierarchyWithFolderLevelPermissions } from "./decorators/GetFolderHierarchyWithFolderLevelPermissions.js";

interface LegacyDeps {
    storageOperations: AcoFolderStorageOperations;
}

export const GetFolderHierarchyFeature = createFeature({
    name: "GetFolderHierarchy",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            const folderLevelPermissions = container.resolve(FolderLevelPermissions);
            const baseUseCase = new GetFolderHierarchyUseCase(deps.storageOperations);

            return new GetFolderHierarchyWithFolderLevelPermissions(
                folderLevelPermissions,
                baseUseCase
            );
        });
    }
});
