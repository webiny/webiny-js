import { createFeature } from "@webiny/feature";
import type { Container } from "@webiny/di-container";
import { UpdateFolderUseCase } from "./UpdateFolderUseCase.js";
import { UpdateFolderUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { FolderLevelPermissions } from "~/flp/index.js";
import type { AcoFolderStorageOperations } from "~/types.js";
import { EventPublisher } from "@webiny/api-core";
import { UpdateFolderWithFolderLevelPermissions } from "./decorators/UpdateFolderWithFolderLevelPermissions.js";

interface LegacyDeps {
    storageOperations: AcoFolderStorageOperations;
    folderLevelPermissions: FolderLevelPermissions;
}

export const UpdateFolderFeature = createFeature({
    name: "UpdateFolder",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            const eventPublisher = container.resolve(EventPublisher);
            const baseUseCase = new UpdateFolderUseCase(eventPublisher, deps.storageOperations);

            return new UpdateFolderWithFolderLevelPermissions(
                deps.folderLevelPermissions,
                deps.storageOperations.getFolder,
                baseUseCase
            );
        });
    }
});
