import type { FolderLevelPermission, FolderPermission } from "~/flp/flp.types.js";

export class Permissions {
    public static create(
        permissions?: FolderPermission[],
        parentFlp?: Pick<FolderLevelPermission, "id" | "permissions"> | null
    ): FolderPermission[] {
        // Code-defined permissions (contributed via an `FlpFactory`) are merged into FLP records on
        // read only. Every write to the FLP catalog funnels through here, so this is where we make
        // sure they can never be persisted — otherwise a client echoing back what it read would turn
        // a code permission into a stored one that nobody can remove from the UI.
        const inheritedFromParent = `parent:${parentFlp?.id}`;

        const parentFolderPermissions = (parentFlp?.permissions || []).filter(p => !p.plugin);
        const currentFolderPermissions = (permissions || []).filter(
            p => !p.plugin && p.inheritedFrom !== inheritedFromParent
        );

        if (!parentFolderPermissions.length) {
            return currentFolderPermissions;
        }

        // Merge parent and current folder permissions:
        // - current folder permissions take precedence over parent permissions
        // - only if parent permission's level is set to `no-access`, then we ignore the current folder permission
        const permissionsInheritedFromParentFolder: FolderPermission[] = [];

        for (const parentFolderPermission of parentFolderPermissions) {
            if (parentFolderPermission.level === "no-access") {
                permissionsInheritedFromParentFolder.push({
                    ...parentFolderPermission,
                    inheritedFrom: inheritedFromParent
                });
                continue;
            }

            const currentFolderHasOverridePermission = currentFolderPermissions.some(
                permission => permission.target === parentFolderPermission.target
            );

            if (currentFolderHasOverridePermission) {
                continue;
            }

            permissionsInheritedFromParentFolder.push({
                ...parentFolderPermission,
                inheritedFrom: inheritedFromParent
            });
        }

        // Add current folder permissions that are not present in the parent folder permissions.
        const applicableCurrentFolderPermissions = currentFolderPermissions.filter(permission => {
            const alreadyInInheritedPermissions = permissionsInheritedFromParentFolder.some(
                p => p.target === permission.target
            );

            return !alreadyInInheritedPermissions;
        });

        return [...applicableCurrentFolderPermissions, ...permissionsInheritedFromParentFolder];
    }
}
