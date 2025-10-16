import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { CreateFolderUseCase } from "./CreateFolderUseCase.js";
import { CreateFolderWithFolderLevelPermissions } from "~/features/folders/CreateFolder/decorators/CreateFolderWithFolderLevelPermissions.js";

export const CreateFolderFeature = createFeature({
    name: "CreateFolder",
    register(container: Container) {
        container.register(CreateFolderUseCase);
        container.registerDecorator(CreateFolderWithFolderLevelPermissions);
    }
});
