import type { FieldPermission } from "~/types/index.js";

interface HasPermissions {
    permissions?: FieldPermission[];
}

interface IdentityLike {
    id: string;
    teams: { id: string }[];
}

export interface FieldPermissions {
    canView: boolean;
    canEdit: boolean;
}

const FULL_ACCESS: FieldPermissions = { canView: true, canEdit: true };
const VIEW_ONLY: FieldPermissions = { canView: true, canEdit: false };
const NO_ACCESS: FieldPermissions = { canView: false, canEdit: false };

export const getFieldPermissions = (
    identity: IdentityLike,
    item: HasPermissions
): FieldPermissions => {
    const permissions = item.permissions;

    // No permissions defined = full access for everyone.
    if (!permissions || permissions.length === 0) {
        return FULL_ACCESS;
    }

    // Build the set of targets that represent this user.
    const userTargets = new Set<string>();
    userTargets.add(`admin:${identity.id}`);
    for (const team of identity.teams) {
        userTargets.add(`team:${team.id}`);
    }

    // Find the first matching permission entry.
    const match = permissions.find(p => userTargets.has(p.target));

    // If no matching entry, user is not in the permissions list = full access (default allow).
    if (!match) {
        return FULL_ACCESS;
    }

    switch (match.accessLevel) {
        case "viewer":
            return VIEW_ONLY;
        case "no-access":
            return NO_ACCESS;
        default:
            return FULL_ACCESS;
    }
};
