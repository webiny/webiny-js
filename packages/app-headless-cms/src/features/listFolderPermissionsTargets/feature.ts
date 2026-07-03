import { createFeature } from "@webiny/feature/admin";
import { ListFolderPermissionsTargetsUseCase as UseCase } from "./abstractions.js";
import { ListFolderPermissionsTargetsUseCase } from "./ListFolderPermissionsTargetsUseCase.js";
import { ListFolderPermissionsTargetsGateway } from "./ListFolderPermissionsTargetsGateway.js";

export const ListFolderPermissionsTargetsFeature = createFeature({
    name: "CmsListFolderPermissionsTargets",
    register(container) {
        container.register(ListFolderPermissionsTargetsUseCase);
        container.register(ListFolderPermissionsTargetsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
