import { createFeature } from "@webiny/feature/api";
import { AdminUsersRepository } from "./shared/AdminUsersRepository.js";
import { GetUserFeature } from "./GetUser/feature.js";
import { ListUsersFeature } from "./ListUsers/feature.js";
import { CreateUserFeature } from "./CreateUser/feature.js";
import { UpdateUserFeature } from "./UpdateUser/feature.js";
import { DeleteUserFeature } from "./DeleteUser/feature.js";
import { ListUserTeamsFeature } from "~/features/users/ListUserTeams/feature.js";
import { AdminUsersStorageOperations } from "~/features/users/shared/storageAbstractions.js";
import { ExternalIdpUserSyncFeature } from "~/features/users/ExternalIdpUserSync/index.js";

export const AdminUsersFeature = createFeature({
    name: "AdminUsers",
    register(container, storageOperations: AdminUsersStorageOperations.Interface) {
        // Register repository in singleton scope
        container.register(AdminUsersRepository).inSingletonScope();

        // Register all use cases
        GetUserFeature.register(container);
        ListUsersFeature.register(container);
        ListUserTeamsFeature.register(container);
        CreateUserFeature.register(container);
        UpdateUserFeature.register(container);
        DeleteUserFeature.register(container);
        ExternalIdpUserSyncFeature.register(container);

        // Legacy storage ops
        container.registerInstance(AdminUsersStorageOperations, storageOperations);
    }
});
