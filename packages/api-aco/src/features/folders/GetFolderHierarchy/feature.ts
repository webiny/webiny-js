import { createFeature } from "@webiny/feature";
import type { Container } from "@webiny/di-container";
import { GetFolderHierarchyUseCase } from "./GetFolderHierarchyUseCase.js";
import { GetFolderHierarchyUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { FolderLevelPermissions } from "~/flp/index.js";
import type { AcoFolderStorageOperations } from "~/types.js";
import { GetFolderHierarchyWithFolderLevelPermissions } from "./decorators/GetFolderHierarchyWithFolderLevelPermissions.js";

interface LegacyDeps {
    storageOperations: AcoFolderStorageOperations;
    folderLevelPermissions: FolderLevelPermissions;
}

export const GetFolderHierarchyFeature = createFeature({
    name: "GetFolderHierarchy",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            const baseUseCase = new GetFolderHierarchyUseCase(deps.storageOperations);

            return new GetFolderHierarchyWithFolderLevelPermissions(
                deps.folderLevelPermissions,
                baseUseCase
            );
        });
    }
});
