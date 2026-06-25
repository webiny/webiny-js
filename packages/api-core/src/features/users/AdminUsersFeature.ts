import { createFeature } from "@webiny/feature/api";
import { AdminUsersRepository } from "./shared/AdminUsersRepository.js";
import { GetUserFeature } from "./GetUser/feature.js";
import { GetIdentityProfileFeature } from "./GetIdentityProfile/feature.js";
import { ListUsersFeature } from "./ListUsers/feature.js";
import { CreateUserFeature } from "./CreateUser/feature.js";
import { UpdateUserFeature } from "./UpdateUser/feature.js";
import { DeleteUserFeature } from "./DeleteUser/feature.js";
import { ListUserTeamsFeature } from "./ListUserTeams/feature.js";
import { ExternalIdpUserSyncFeature } from "./ExternalIdpUserSync/index.js";

export const AdminUsersFeature = createFeature({
    name: "AdminUsers",
    register(container) {
        // Register repository in singleton scope
        container.register(AdminUsersRepository).inSingletonScope();

        // Register all use cases
        GetUserFeature.register(container);
        GetIdentityProfileFeature.register(container);
        ListUsersFeature.register(container);
        ListUserTeamsFeature.register(container);
        CreateUserFeature.register(container);
        UpdateUserFeature.register(container);
        DeleteUserFeature.register(container);
        ExternalIdpUserSyncFeature.register(container);
    }
});
