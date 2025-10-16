import type { FolderAccessLevel, FolderPermission } from "~/flp/flp.types.js";
import type { Identity } from "@webiny/api-authentication/types.js";
import type { SecurityPermission } from "@webiny/api-security/types.js";

export class DefaultPermissionsMerger {
    static merge(
        identity: Identity,
        identityPermissions: SecurityPermission[],
        folderPermissions: FolderPermission[]
    ): FolderPermission[] {
        // If the user has full access permission, add a specific "owner" permission to the list.
        // This ensures the user has complete control over the folder.
        const hasFullAccess = identityPermissions.some(p => p.name === "*");
        if (hasFullAccess) {
            return [
                {
                    target: `admin:${identity.id}`,
                    level: "owner" as FolderAccessLevel,
                    inheritedFrom: "role:full-access"
                },

                // Remove any permissions related to the full access user,
                // as these are always superseded by the "owner" permission defined above.
                ...folderPermissions.filter(p => p.target !== `admin:${identity.id}`)
            ];
        }

        if (folderPermissions.length === 0) {
            // No permissions provided. This means the folder is public.
            // Add a specific "public" permission to the list to ensure the folder is accessible to everyone.
            return [
                {
                    target: `admin:${identity.id}`,
                    level: "public" as FolderAccessLevel,
                    inheritedFrom: "public"
                }
            ];
        }

        // If there are multiple `admin:${identity.id}` permissions in the array,
        // we need to pick the one with the highest access level. We also remove
        // other permissions for the same identity.

        // Get permissions related to the current identity (admin).
        const currentAdminPermissions = folderPermissions.filter(
            p => p.target === `admin:${identity.id}`
        );

        if (currentAdminPermissions.length === 0) {
            return folderPermissions;
        }

        const noAccessPermission = currentAdminPermissions.find(
            p => p.level === "no-access" && p.target === `admin:${identity.id}`
        );

        if (noAccessPermission) {
            // If one of the permissions is `no-access`, then we can immediately return it. This is
            // because `no-access` is the ultimate level of access, and no other permission can override it.
            // Remove all permissions for the current identity and add the winning one.
            const filteredPermissions = folderPermissions.filter(
                p => p.target !== `admin:${identity.id}`
            );

            return [...filteredPermissions, noAccessPermission];
        }

        const [firstAdminPermission, ...restAdminPermissions] = currentAdminPermissions;

        const resultPermission = restAdminPermissions.reduce((winner, current) => {
            const winnerInherits = winner.inheritedFrom?.startsWith("parent:");
            const currentInherits = current.inheritedFrom?.startsWith("parent:");

            if (winnerInherits && !currentInherits) {
                return current;
            }
            if (currentInherits && !winnerInherits) {
                return winner;
            }

            // At this point, we're either comparing two permissions with `inheritedFrom` or two without it.
            // In other words, we're now at a point where we start comparing the levels (owner > editor > viewer).
            if (current.level === "owner") {
                return current;
            }

            if (current.level === "editor" && winner.level === "viewer") {
                return current;
            }

            return winner;
        }, firstAdminPermission);

        // Remove all permissions for the current identity and add the winning one.
        return [
            resultPermission,
            ...folderPermissions.filter(p => p.target !== `admin:${identity.id}`)
        ];
    }
}
