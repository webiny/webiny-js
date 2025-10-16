import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { GetFolderUseCase } from "./GetFolderUseCase.js";
import { GetFolderWithFolderLevelPermissions } from "./decorators/GetFolderWithFolderLevelPermissions.js";

export const GetFolderFeature = createFeature({
    name: "GetFolder",
    register(container: Container) {
        container.register(GetFolderUseCase);
        container.registerDecorator(GetFolderWithFolderLevelPermissions);
    }
});
