import { createFeature } from "@webiny/feature";
import type { Container } from "@webiny/di-container";
import { DeleteFolderUseCase } from "./DeleteFolderUseCase.js";
import { DeleteFolderUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { FolderLevelPermissions } from "~/flp/index.js";
import type { AcoFolderStorageOperations } from "~/types.js";
import { EventPublisher } from "@webiny/api-core";
import { DeleteFolderWithFolderLevelPermissions } from "./decorators/DeleteFolderWithFolderLevelPermissions.js";

interface LegacyDeps {
    storageOperations: AcoFolderStorageOperations;
    folderLevelPermissions: FolderLevelPermissions;
}

export const DeleteFolderFeature = createFeature({
    name: "DeleteFolder",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            const eventPublisher = container.resolve(EventPublisher);
            const baseUseCase = new DeleteFolderUseCase(eventPublisher, deps.storageOperations);

            return new DeleteFolderWithFolderLevelPermissions(
                deps.folderLevelPermissions,
                baseUseCase
            );
        });
    }
});
