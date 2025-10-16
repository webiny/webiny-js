import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { UpdateFolderUseCase } from "./UpdateFolderUseCase.js";
import { UpdateFolderUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import type { AcoFolderStorageOperations } from "~/types.js";
import { EventPublisher } from "@webiny/api-core";
import { UpdateFolderWithFolderLevelPermissions } from "./decorators/UpdateFolderWithFolderLevelPermissions.js";

interface LegacyDeps {
    storageOperations: AcoFolderStorageOperations;
}

export const UpdateFolderFeature = createFeature({
    name: "UpdateFolder",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            const eventPublisher = container.resolve(EventPublisher);
            const folderLevelPermissions = container.resolve(FolderLevelPermissions);
            const baseUseCase = new UpdateFolderUseCase(eventPublisher, deps.storageOperations);

            return new UpdateFolderWithFolderLevelPermissions(
                folderLevelPermissions,
                deps.storageOperations.getFolder,
                baseUseCase
            );
        });
    }
});
