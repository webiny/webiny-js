import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { DeleteFolderUseCase } from "./DeleteFolderUseCase.js";
import { DeleteFolderUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import type { AcoFolderStorageOperations } from "~/types.js";
import { EventPublisher } from "@webiny/api-core";
import { DeleteFolderWithFolderLevelPermissions } from "./decorators/DeleteFolderWithFolderLevelPermissions.js";

interface LegacyDeps {
    storageOperations: AcoFolderStorageOperations;
}

export const DeleteFolderFeature = createFeature({
    name: "DeleteFolder",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            const eventPublisher = container.resolve(EventPublisher);
            const folderLevelPermissions = container.resolve(FolderLevelPermissions);
            const baseUseCase = new DeleteFolderUseCase(eventPublisher, deps.storageOperations);

            return new DeleteFolderWithFolderLevelPermissions(
                folderLevelPermissions,
                baseUseCase
            );
        });
    }
});
