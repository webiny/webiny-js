import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/AuthenticatedIdentity.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type { Role, Team } from "@webiny/api-core/types/security.js";
import type { FolderAccessLevel, FolderPermission } from "~/flp/flp.types.js";
import { DefaultPermissionsMerger } from "~/features/flp/FolderLevelPermissions/useCases/GetDefaultPermissions/DefaultPermissionsMerger.js";
import { expandTeamPermissions } from "~/features/flp/FolderLevelPermissions/useCases/GetDefaultPermissions/GetDefaultPermissionsWithTeams.js";

/** Teams and roles, looked up once and shared by every user being checked. */
export interface AccessDirectory {
    teamsEnabled: boolean;
    teamsById: Map<string, Team>;
    rolesById: Map<string, Role>;
}

/** What a user's requests would carry into folder-level permission checks. */
export interface UserAccessProfile {
    identity: AuthenticatedIdentity;
    teams: Team[];
    hasFullAccess: boolean;
}

export interface UserFolderLevel {
    /** Never `no-access`: a user without access gets no level at all. */
    level: FolderAccessLevel;
    /** `direct`, `parent:<id>`, `team:<slug>`, `role:full-access` or `public`. */
    via: string;
}

export const createAccessDirectory = (
    teams: Team[],
    roles: Role[],
    teamsEnabled: boolean
): AccessDirectory => ({
    teamsEnabled,
    teamsById: new Map(teams.map(team => [team.id, team])),
    rolesById: new Map(roles.map(role => [role.id, role]))
});

export const createUserAccessProfile = (
    user: AdminUser,
    directory: AccessDirectory
): UserAccessProfile => {
    const teams = directory.teamsEnabled
        ? (user.teams ?? [])
              .map(id => directory.teamsById.get(id))
              .filter((team): team is Team => !!team)
        : [];
    // As the authorizer does: the user's roles, plus their teams' roles.
    const roleIds = [...(user.roles ?? []), ...teams.flatMap(team => team.roles)];
    const hasFullAccess = roleIds.some(id =>
        directory.rolesById.get(id)?.permissions.some(permission => permission.name === "*")
    );
    return {
        identity: new AuthenticatedIdentity({
            id: user.id,
            type: "admin",
            displayName: user.displayName
        }),
        teams,
        hasFullAccess
    };
};

/**
 * The level a user ends up with on a folder, by the steps a request of theirs takes: their teams'
 * grants are expanded into theirs (`GetDefaultPermissionsWithTeams`), the defaults merged in
 * (`DefaultPermissionsMerger`: full access is owner, a folder without permissions is public), and
 * no grant of their own or `no-access` means no access (`canAccessFolderContent`).
 */
export const getUserFolderLevel = (
    profile: UserAccessProfile,
    permissions: FolderPermission[],
    teamsEnabled: boolean
): UserFolderLevel | null => {
    const { identity, teams, hasFullAccess } = profile;
    const merged = DefaultPermissionsMerger.merge(
        identity,
        hasFullAccess ? [{ name: "*" }] : [],
        teamsEnabled ? expandTeamPermissions(identity, teams, permissions) : permissions
    );
    const own = merged.find(permission => permission.target === `admin:${identity.id}`);
    if (!own || own.level === "no-access") {
        return null;
    }
    return { level: own.level, via: own.inheritedFrom ?? "direct" };
};
