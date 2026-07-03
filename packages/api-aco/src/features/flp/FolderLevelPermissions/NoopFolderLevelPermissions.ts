import { FolderLevelPermissions, type IFolderLevelPermissions } from "./abstractions.js";
import type { FolderPermission } from "~/types.js";

class NoopFolderLevelPermissionsImpl implements IFolderLevelPermissions {
    canUseFolderLevelPermissions(): boolean {
        return false;
    }

    canUseTeams(): boolean {
        return false;
    }

    canCreateFolderInRoot(): boolean {
        return true;
    }

    permissionsIncludeNonInheritedPermissions(): boolean {
        return false;
    }

    async canAccessFolder(): Promise<boolean> {
        return true;
    }

    async canAccessFolderContent(): Promise<boolean> {
        return true;
    }

    async ensureCanAccessFolder(): Promise<void> {
        return;
    }

    async ensureCanAccessFolderContent(): Promise<void> {
        return;
    }

    async canManageFolderContent(): Promise<boolean> {
        return true;
    }

    async canManageFolderStructure(): Promise<boolean> {
        return true;
    }

    async canManageFolderPermissions(): Promise<boolean> {
        return true;
    }

    async getDefaultPermissions(permissions: FolderPermission[]): Promise<FolderPermission[]> {
        return permissions;
    }

    async listFolderLevelPermissions(): Promise<
        Array<{ id: string; permissions: FolderPermission[] }>
    > {
        return [];
    }

    async getFolderLevelPermissions(): Promise<FolderPermission[]> {
        return [];
    }
}

export const NoopFolderLevelPermissions = FolderLevelPermissions.createImplementation({
    implementation: NoopFolderLevelPermissionsImpl,
    dependencies: []
});
