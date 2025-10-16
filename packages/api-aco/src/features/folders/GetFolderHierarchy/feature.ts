import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { GetFolderHierarchyUseCase } from "./GetFolderHierarchyUseCase.js";
import { GetFolderHierarchyWithFolderLevelPermissions } from "./decorators/GetFolderHierarchyWithFolderLevelPermissions.js";

export const GetFolderHierarchyFeature = createFeature({
    name: "GetFolderHierarchy",
    register(container: Container) {
        container.register(GetFolderHierarchyUseCase);
        container.registerDecorator(GetFolderHierarchyWithFolderLevelPermissions);
    }
});
