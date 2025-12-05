import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { DeleteFolderRepository } from "./DeleteFolderRepository.js";
import { DeleteFolderUseCase } from "./DeleteFolderUseCase.js";
import { DeleteFolderWithFolderLevelPermissions } from "./decorators/DeleteFolderWithFolderLevelPermissions.js";

export const DeleteFolderFeature = createFeature({
    name: "DeleteFolder",
    register(container: Container) {
        container.register(DeleteFolderRepository).inSingletonScope();
        container.register(DeleteFolderUseCase);
        container.registerDecorator(DeleteFolderWithFolderLevelPermissions);
    }
});
