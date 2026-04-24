import { createFeature } from "@webiny/feature/api";
import { ListFolderLevelPermissionsTargetsUseCase } from "./ListFolderLevelPermissionsTargetsUseCase.js";

export const ListFolderLevelPermissionsTargetsFeature = createFeature({
    name: "ListFolderLevelPermissionsTargets",
    register(container) {
        container.register(ListFolderLevelPermissionsTargetsUseCase);
    }
});
