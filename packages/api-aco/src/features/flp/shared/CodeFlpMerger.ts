import type { FolderLevelPermission, FolderPermission } from "~/flp/flp.types.js";

export class CodeFlpMerger {
    /**
     * Merge code-defined permissions into a stored FLP record.
     *
     * Code permissions are placed first, and a stored permission for the same target is dropped:
     * downstream consumers resolve a target with `Array.find`, so being first is what makes a code
     * permission win over a hand-assigned one for that same target.
     */
    static merge(
        flp: FolderLevelPermission,
        codePermissions: FolderPermission[]
    ): FolderLevelPermission {
        if (!codePermissions.length) {
            return flp;
        }

        const codeTargets = new Set(codePermissions.map(permission => permission.target));

        return {
            ...flp,
            permissions: [
                ...codePermissions,
                ...flp.permissions.filter(permission => !codeTargets.has(permission.target))
            ]
        };
    }
}
