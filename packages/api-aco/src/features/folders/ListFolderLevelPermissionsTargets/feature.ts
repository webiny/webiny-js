import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { ListFolderLevelPermissionsTargetsUseCase } from "./ListFolderLevelPermissionsTargetsUseCase.js";
import { ListFolderLevelPermissionsTargetsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAdminUsersGatewayFromContext } from "./gateways/ListAdminUsersGatewayFromContext.js";
import { ListTeamsGatewayFromContext } from "./gateways/ListTeamsGatewayFromContext.js";
import type { Security } from "@webiny/api-security/types.js";
import type { AdminUsers } from "@webiny/api-admin-users/types.js";

interface LegacyDeps {
    security: Security;
    adminUsers: AdminUsers;
}

export const ListFolderLevelPermissionsTargetsFeature = createFeature({
    name: "ListFolderLevelPermissionsTargets",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            const listAdminUsersGateway = new ListAdminUsersGatewayFromContext(
                deps.security,
                deps.adminUsers
            );

            const listTeamsGateway = new ListTeamsGatewayFromContext(deps.security);

            return new ListFolderLevelPermissionsTargetsUseCase(
                listAdminUsersGateway,
                listTeamsGateway
            );
        });
    }
});
