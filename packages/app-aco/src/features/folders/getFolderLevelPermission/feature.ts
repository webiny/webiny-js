import { createFeature } from "@webiny/feature/admin";
import { GetFolderLevelPermissionUseCase as UseCase } from "./abstractions.js";
import { GetFolderLevelPermissionUseCase } from "./GetFolderLevelPermissionUseCase.js";
import { GetFolderLevelPermissionWithFlpDecorator } from "./decorators/GetFolderLevelPermissionWithFlpDecorator.js";

export const GetFolderLevelPermissionFeature = createFeature({
    name: "GetFolderLevelPermission",
    register(container) {
        // Register base use case
        container.register(GetFolderLevelPermissionUseCase);

        // Register decorator
        container.registerDecorator(GetFolderLevelPermissionWithFlpDecorator);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
