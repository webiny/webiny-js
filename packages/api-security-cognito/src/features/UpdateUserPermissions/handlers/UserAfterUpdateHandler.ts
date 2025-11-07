import deepEqual from "deep-equal";
import { UserAfterUpdateHandler } from "@webiny/api-core/features/UpdateUser";
import { createImplementation } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { ListTeamsUseCase } from "@webiny/api-core/features/ListTeams";
import { ListGroupsUseCase } from "@webiny/api-core/features/ListGroups";
import { UpdateTenantLinks } from "@webiny/api-core/features/UpdateTenantLinks";
import type {
    PermissionsTenantLink,
    PermissionsTenantLinkTeam
} from "@webiny/api-core/types/security.js";

class UserAfterUpdateHandlerImpl implements UserAfterUpdateHandler.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private listTeams: ListTeamsUseCase.Interface,
        private listGroups: ListGroupsUseCase.Interface,
        private updateTenantLinks: UpdateTenantLinks.Interface
    ) {}

    async handle(event: UserAfterUpdateHandler.Event): Promise<void> {
        const { updatedUser, originalUser } = event.payload;

        if (originalUser.external) {
            return;
        }

        const tenant = this.tenantContext.getTenant();

        // If group/team hasn't changed, we don't need to do anything.
        const groupsChanged = !deepEqual(updatedUser.groups, originalUser.groups);
        const teamsChanged = !deepEqual(updatedUser.teams, originalUser.teams);
        if (!groupsChanged && !teamsChanged) {
            return;
        }

        const data: PermissionsTenantLink["data"] = { groups: [], teams: [] };

        const updatedUserTeams = updatedUser.teams || [];
        if (updatedUserTeams.length > 0) {
            const teamsResult = await this.listTeams.execute({
                where: { id_in: updatedUserTeams }
            });
            if (teamsResult.isFail()) {
                throw new Error(`Failed to list teams: ${teamsResult.error.message}`);
            }
            const teams = teamsResult.value;

            if (teams.length > 0) {
                const tenantLinkTeams: PermissionsTenantLinkTeam[] = [];
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

                    tenantLinkTeams.push({
                        id: team.id,
                        groups: teamGroups.map(group => {
                            return { id: group.id, permissions: group.permissions };
                        })
                    });
                }
                data.teams = tenantLinkTeams;
            }
        }

        const updatedUserGroups = updatedUser.groups || [];
        if (updatedUserGroups.length > 0) {
            const groupsResult = await this.listGroups.execute({
                where: { id_in: updatedUserGroups }
            });
            if (groupsResult.isFail()) {
                throw new Error(`Failed to list groups: ${groupsResult.error.message}`);
            }
            const groups = groupsResult.value;

            if (groups.length > 0) {
                data.groups = groups.map(group => {
                    return { id: group.id, permissions: group.permissions };
                });
            }
        }

        const updateResult = await this.updateTenantLinks.execute([
            {
                tenant: tenant.id,
                identity: updatedUser.id,

                // With 5.37.0, these tenant links not only contain group-related permissions,
                // but teams-related too. The `type=group` hasn't been changed, just so the
                // data migrations are easier.
                type: "group",
                data
            }
        ]);

        if (updateResult.isFail()) {
            throw new Error(`Failed to update tenant links: ${updateResult.error.message}`);
        }
    }
}

export const CognitoUserAfterUpdateHandler = createImplementation({
    abstraction: UserAfterUpdateHandler,
    implementation: UserAfterUpdateHandlerImpl,
    dependencies: [TenantContext, ListTeamsUseCase, ListGroupsUseCase, UpdateTenantLinks]
});
