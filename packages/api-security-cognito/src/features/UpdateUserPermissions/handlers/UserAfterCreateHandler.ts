import { createImplementation } from "@webiny/feature/api";
import { UserAfterCreateHandler } from "@webiny/api-core/features/CreateUser";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { ListTeamsUseCase } from "@webiny/api-core/features/ListTeams";
import { ListGroupsUseCase } from "@webiny/api-core/features/ListGroups";
import { CreateTenantLinks } from "@webiny/api-core/features/CreateTenantLinks";
import type { PermissionsTenantLink } from "@webiny/api-core/types/security.js";

class UserAfterCreateHandlerImpl implements UserAfterCreateHandler.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private listTeams: ListTeamsUseCase.Interface,
        private listGroups: ListGroupsUseCase.Interface,
        private createTenantLinks: CreateTenantLinks.Interface
    ) {}

    async handle(event: UserAfterCreateHandler.Event): Promise<void> {
        const { user } = event.payload;

        if (user.external) {
            return;
        }

        const tenant = this.tenantContext.getTenant();

        const data: PermissionsTenantLink["data"] = { groups: [], teams: [] };

        const userTeams = user.teams || [];
        if (userTeams.length > 0) {
            const teamsResult = await this.listTeams.execute({ where: { id_in: userTeams } });
            if (teamsResult.isFail()) {
                throw new Error(`Failed to list teams: ${teamsResult.error.message}`);
            }
            const teams = teamsResult.value;

            for (const team of teams) {
                const teamGroupsResult = await this.listGroups.execute({
                    where: { id_in: team.groups }
                });
                if (teamGroupsResult.isFail()) {
                    throw new Error(
                        `Failed to list team groups: ${teamGroupsResult.error.message}`
                    );
                }
                const teamGroups = teamGroupsResult.value;

                data.teams.push({
                    id: team.id,
                    groups: teamGroups.map(group => ({
                        id: group.id,
                        permissions: group.permissions
                    }))
                });
            }
        }

        const userGroups = user.groups || [];
        if (userGroups.length > 0) {
            const groupsResult = await this.listGroups.execute({ where: { id_in: userGroups } });
            if (groupsResult.isFail()) {
                throw new Error(`Failed to list groups: ${groupsResult.error.message}`);
            }
            const groups = groupsResult.value;

            for (const group of groups) {
                data.groups.push({ id: group.id, permissions: group.permissions });
            }
        }

        const createResult = await this.createTenantLinks.execute([
            {
                tenant: tenant.id,
                // IMPORTANT!
                // Use the `id` that was assigned in the user creation process.
                // `syncWithCognito` will assign the `sub` value to the user id, so that the identity id matches the user id.
                identity: user.id,

                // With 5.37.0, these tenant links not only contain group-related permissions,
                // but teams-related too. The `type=group` hasn't been changed, just so the
                // data migrations are easier.
                type: "group",
                data
            }
        ]);

        if (createResult.isFail()) {
            throw new Error(`Failed to create tenant links: ${createResult.error.message}`);
        }
    }
}

export const CognitoUserAfterCreateHandler = createImplementation({
    abstraction: UserAfterCreateHandler,
    implementation: UserAfterCreateHandlerImpl,
    dependencies: [TenantContext, ListTeamsUseCase, ListGroupsUseCase, CreateTenantLinks]
});
