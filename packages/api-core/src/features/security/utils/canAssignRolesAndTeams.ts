import type { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import type { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import type { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import {
    canGrantPermissions,
    type RequestedPermissions
} from "~/features/security/utils/canGrantPermissions.js";

export interface CanAssignRolesAndTeamsParams {
    identityContext: IdentityContext.Interface;
    rolesRepository: RolesRepository.Interface;
    teamsRepository: TeamsRepository.Interface;
    roles: (string | undefined | null)[];
    teams: (string | undefined | null)[];
}

const unique = (ids: (string | undefined | null)[]) => {
    return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
};

/**
 * Security: a caller may only assign roles and teams (to a user, or roles to a team) whose
 * permissions they hold themselves. See `canGrantPermissions`.
 * Code running without authorization (installers, IdP user sync) and full access may assign anything.
 */
export const canAssignRolesAndTeams = async (
    params: CanAssignRolesAndTeamsParams
): Promise<boolean> => {
    const { identityContext, rolesRepository, teamsRepository } = params;

    if (!identityContext.isAuthorizationEnabled()) {
        return true;
    }

    if (await identityContext.hasFullAccess()) {
        return true;
    }

    const roleIds = unique(params.roles);
    const teamIds = unique(params.teams);

    if (teamIds.length > 0) {
        const teamsResult = await teamsRepository.list({ where: { id_in: teamIds } });
        if (teamsResult.isFail()) {
            return false;
        }
        for (const team of teamsResult.value) {
            roleIds.push(...unique(team.roles ?? []));
        }
    }

    const dedupedRoleIds = unique(roleIds);
    if (dedupedRoleIds.length === 0) {
        return true;
    }

    const rolesResult = await rolesRepository.list({ where: { id_in: dedupedRoleIds } });
    if (rolesResult.isFail()) {
        return false;
    }

    // Each role is loaded as its own group of permissions (see `getPermissionsFromRoles`).
    // Roles that don't exist grant nothing.
    const requested: RequestedPermissions[] = rolesResult.value.map(role => role.permissions ?? []);

    return canGrantPermissions(identityContext, requested);
};
