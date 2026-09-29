import type { FolderLevelPermission, FolderPermission } from "~/flp/flp.types.js";

export class CodeFlpMerger {
    /**
     * Merge code-defined permissions into a stored FLP record.
     *
     * A code-defined permission always wins over a stored one for the same target, and that takes
     * both steps below — ordering alone is not enough, because the two downstream consumers pick a
     * target's permission in different ways:
     *
     * - `CanAccessFolder` takes the first match (`permissions.find(p => p.target === ...)`), so code
     *   permissions go first.
     * - `DefaultPermissionsMerger` instead collects *every* permission for the identity and reduces
     *   them by access level, preferring `no-access` and then `owner`. A leftover duplicate would
     *   join that reduce and could outrank the code-defined entry — a stored `owner` would beat a
     *   code-defined `viewer`. Dropping the stored permission for a code-defined target is what
     *   prevents it.
     *
     * So: exactly one permission per target, and for code-defined targets it is the code one.
     */
    static merge(
        flp: FolderLevelPermission,
        codePermissions: FolderPermission[]
    ): FolderLevelPermission {
        if (!codePermissions.length) {
            return flp;
        }

        return {
            ...flp,
            permissions: CodeFlpMerger.mergePermissions(flp.permissions, codePermissions)
        };
    }

    /**
     * The same merge, for callers that hold a plain permission list rather than a stored FLP record
     * — the write paths, which resolve code permissions from the folder's own type and path.
     */
    static mergePermissions(
        permissions: FolderPermission[],
        codePermissions: FolderPermission[]
    ): FolderPermission[] {
        if (!codePermissions.length) {
            return permissions;
        }

        const codeTargets = new Set(codePermissions.map(permission => permission.target));

        return [
            ...codePermissions,
            ...permissions.filter(permission => !codeTargets.has(permission.target))
        ];
    }
}
