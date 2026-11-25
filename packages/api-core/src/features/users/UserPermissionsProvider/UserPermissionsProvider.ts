import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { UserPermissionsProvider as Abstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";
import { PermissionTransformer } from "~/features/security/authorization/AuthorizationContext/abstractions.js";
import { getPermissionsFromRoles } from "~/features/security/utils/getPermissionsFromRoles.js";
import { transformPermissions } from "~/features/security/utils/transformPermissions.js";
import { applyAaclLogic } from "~/features/security/utils/applyAaclLogic.js";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { Role } from "~/types/security.js";
import type { Team } from "~/types/security.js";

// The user's own roles, plus the roles of the teams the user belongs to.
const getUserRoles = (user: AdminUser, roles: Role[], teams: Team[]) => {
    const roleIds = new Set(user.roles ?? []);

    const userTeamIds = user.teams ?? [];
    for (const team of teams) {
        if (userTeamIds.includes(team.id)) {
            team.roles.forEach(roleId => roleIds.add(roleId));
        }
    }

    return roles.filter(role => roleIds.has(role.id));
};

/*
 * Builds each user's permissions the way a signed-in user's are built: the roles from
 * `GetPermissionsFromIdentity`, then `transformPermissions` as in `AuthorizationContext`, then
 * `applyAaclLogic` as in `IdentityContext`. Roles and teams are loaded once for all users
 * instead of once per user. A failed load is returned as an error rather than as users
 * without permissions, because the caller shows the result as an answer.
 */
class UserPermissionsProviderImpl implements Abstraction.Interface {
    constructor(
        private wcpContext: WcpContext.Interface,
        private usersRepository: AdminUsersRepository.Interface,
        private rolesRepository: RolesRepository.Interface,
        private teamsRepository: TeamsRepository.Interface,
        private transformers: PermissionTransformer.Interface[]
    ) {}

    async listUsersWithPermissions(): Promise<Result<Abstraction.Item[], Abstraction.Error>> {
        const usersResult = await this.usersRepository.list({});
        if (usersResult.isFail()) {
            return Result.fail(usersResult.error);
        }

        const rolesResult = await this.rolesRepository.list({});
        if (rolesResult.isFail()) {
            return Result.fail(rolesResult.error);
        }

        const teamsResult = await this.listTeams();
        if (teamsResult.isFail()) {
            return Result.fail(teamsResult.error);
        }

        const roles = rolesResult.value;
        const teams = teamsResult.value;

        const items = usersResult.value.map(user => {
            const permissions = this.getUserPermissions(user, roles, teams);
            return { user, permissions };
        });

        return Result.ok(items);
    }

    private async listTeams(): Promise<Result<Team[], TeamsRepository.Error>> {
        if (!this.wcpContext.canUseTeams()) {
            return Result.ok([]);
        }
        return this.teamsRepository.list({});
    }

    private getUserPermissions(user: AdminUser, roles: Role[], teams: Team[]) {
        const userRoles = getUserRoles(user, roles, teams);
        const permissions = getPermissionsFromRoles(userRoles);
        const transformed = transformPermissions(permissions, this.transformers);

        return applyAaclLogic(transformed, {
            aaclEnabled: this.wcpContext.canUseAacl(),
            teamsEnabled: this.wcpContext.canUseTeams()
        });
    }
}

export const UserPermissionsProvider = createImplementation({
    abstraction: Abstraction,
    implementation: UserPermissionsProviderImpl,
    dependencies: [
        WcpContext,
        AdminUsersRepository,
        RolesRepository,
        TeamsRepository,
        [PermissionTransformer, { multiple: true }]
    ]
});
