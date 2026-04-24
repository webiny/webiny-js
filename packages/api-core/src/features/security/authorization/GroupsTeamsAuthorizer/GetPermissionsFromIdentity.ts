import { WcpContext } from "~/features/wcp/WcpContext/index.js";
import type { SecurityRole } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";
import { PermissionsProcessor } from "./abstractions.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { getPermissionsFromRoles } from "~/features/security/utils/getPermissionsFromRoles.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";

export type RoleId = string | undefined;
export type TeamId = string | undefined;

class GetPermissionsFromGroupsAndTeamsImpl implements PermissionsProcessor.Interface {
    constructor(
        private wcpContext: WcpContext.Interface,
        private usersRepository: AdminUsersRepository.Interface,
        private rolesRepository: RolesRepository.Interface,
        private teamsRepository: TeamsRepository.Interface
    ) {}

    async getPermissions(identity: Identity) {
        const userResult = await this.usersRepository.get({ id: identity.id });
        if (userResult.isFail()) {
            return null;
        }

        const user = userResult.value;

        // Load roles that are associated with the current identity. Also load roles
        // that are assigned via one or more teams (if the Teams feature is enabled).
        const roleIds: RoleId[] = [];
        const teamIds: TeamId[] = [];

        roleIds.push(...(user.roles ?? []));

        const filteredRoleIds = roleIds.filter(Boolean) as string[];
        const dedupedRoleIds = Array.from(new Set(filteredRoleIds));

        const loadedRoles: SecurityRole[] = [];

        if (dedupedRoleIds.length > 0) {
            const rolesResult = await this.rolesRepository.list({
                where: { id_in: dedupedRoleIds }
            });

            const loadedRolesByIds = rolesResult.isOk() ? rolesResult.value : [];
            loadedRoles.push(...loadedRolesByIds);
        }

        if (this.wcpContext.canUseTeams()) {
            teamIds.push(...(user.teams ?? []));

            const filteredTeamIds = teamIds.filter(Boolean) as string[];
            const dedupedTeamIds = Array.from(new Set(filteredTeamIds));

            if (dedupedTeamIds.length > 0) {
                const teamsResult = await this.teamsRepository.list({
                    where: { id_in: dedupedTeamIds }
                });

                const loadedTeams = teamsResult.isOk() ? teamsResult.value : [];

                // Upon returning teams, we're filtering out team roles that were already loaded.
                // Also note that `team.roles` contains role IDs, not slugs.
                const roleIdsFromTeams = loadedTeams
                    .flatMap(team => team.roles)
                    .filter(roleId => {
                        const alreadyLoaded = loadedRoles.find(role => role.id === roleId);
                        return !alreadyLoaded;
                    });

                if (roleIdsFromTeams.length > 0) {
                    const moreRolesResult = await this.rolesRepository.list({
                        where: { id_in: roleIdsFromTeams }
                    });

                    const rolesFromTeams = moreRolesResult.isOk() ? moreRolesResult.value : [];
                    loadedRoles.push(...rolesFromTeams);
                }
            }
        }

        if (loadedRoles.length > 0) {
            return getPermissionsFromRoles(loadedRoles);
        }

        return null;
    }
}

export const GetPermissionsFromIdentity = PermissionsProcessor.createImplementation({
    implementation: GetPermissionsFromGroupsAndTeamsImpl,
    dependencies: [WcpContext, AdminUsersRepository, RolesRepository, TeamsRepository]
});
