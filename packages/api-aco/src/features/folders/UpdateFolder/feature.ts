import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { UpdateFolderUseCase } from "./UpdateFolderUseCase.js";
import { UpdateFolderWithFolderLevelPermissions } from "./decorators/UpdateFolderWithFolderLevelPermissions.js";

export const UpdateFolderFeature = createFeature({
    name: "UpdateFolder",
    register(container: Container) {
        container.register(UpdateFolderUseCase);
        container.registerDecorator(UpdateFolderWithFolderLevelPermissions);
    }
});
