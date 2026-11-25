import { createFeature } from "@webiny/feature/api";
import { ListUsersWithPermissionsUseCase } from "./ListUsersWithPermissionsUseCase.js";

export const ListUsersWithPermissionsFeature = createFeature({
    name: "ListUsersWithPermissions",
    register(container) {
        container.register(ListUsersWithPermissionsUseCase);
    }
});
