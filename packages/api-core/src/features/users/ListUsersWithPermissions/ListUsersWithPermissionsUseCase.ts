import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListUsersWithPermissionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";
import { PermissionTransformer } from "~/features/security/authorization/AuthorizationContext/abstractions.js";
import { getPermissionsFromRoles } from "~/features/security/utils/getPermissionsFromRoles.js";
import { filterOutCustomWbyAppsPermissions } from "~/features/security/utils/filterOutCustomWbyAppsPermissions.js";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { Role } from "~/types/security.js";
import type { SecurityPermission } from "~/types/security.js";
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
 * Builds each user's permissions the way `GetPermissionsFromIdentity` and `IdentityContext` do
 * for a signed-in user: the user's roles, plus the roles of the user's teams when teams are
 * enabled, then the permission transformers, then the AACL filter. Roles and teams are loaded
 * once for all users instead of once per user.
 */
class ListUsersWithPermissionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private wcpContext: WcpContext.Interface,
        private usersRepository: AdminUsersRepository.Interface,
        private rolesRepository: RolesRepository.Interface,
        private teamsRepository: TeamsRepository.Interface,
        private transformers: PermissionTransformer.Interface[]
    ) {}

    async execute(): Promise<Result<UseCaseAbstraction.Item[], UseCaseAbstraction.Error>> {
        const usersResult = await this.usersRepository.list({});
        if (usersResult.isFail()) {
            return Result.fail(usersResult.error);
        }

        const roles = await this.listRoles();
        const teams = this.wcpContext.canUseTeams() ? await this.listTeams() : [];

        const items = usersResult.value.map(user => {
            const permissions = this.getUserPermissions(user, roles, teams);
            return { user, permissions };
        });

        return Result.ok(items);
    }

    private getUserPermissions(user: AdminUser, roles: Role[], teams: Team[]) {
        const userRoles = getUserRoles(user, roles, teams);
        const permissions = getPermissionsFromRoles(userRoles);
        const transformed = this.transform(permissions);

        return this.applyAacl(transformed);
    }

    private transform(permissions: SecurityPermission[]) {
        if (this.transformers.length === 0) {
            return permissions;
        }

        return permissions.flatMap(permission => {
            return this.transformers.flatMap(transformer => transformer.execute(permission));
        });
    }

    private applyAacl(permissions: SecurityPermission[]) {
        if (this.wcpContext.canUseAacl()) {
            return permissions;
        }
        return filterOutCustomWbyAppsPermissions(permissions);
    }

    private async listRoles() {
        const result = await this.rolesRepository.list({});
        return result.isOk() ? result.value : [];
    }

    private async listTeams() {
        const result = await this.teamsRepository.list({});
        return result.isOk() ? result.value : [];
    }
}

export const ListUsersWithPermissionsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListUsersWithPermissionsUseCaseImpl,
    dependencies: [
        WcpContext,
        AdminUsersRepository,
        RolesRepository,
        TeamsRepository,
        [PermissionTransformer, { multiple: true }]
    ]
});
