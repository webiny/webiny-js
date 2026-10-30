import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import {
    CanAccessFolderContent,
    type CanAccessFolderContentParams
} from "@webiny/api-aco/features/flp/FolderLevelPermissions/useCases/index.js";
import type { FolderAccessLevel, FolderPermission, ListFlpsParams } from "@webiny/api-aco/types.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

/**
 * Folder id → user id → access level. Folders not listed give the current identity `owner`.
 * Reset it in `afterEach`.
 */
export const folderLevels = new Map<string, Map<string, FolderAccessLevel>>();

/** Whether teams are on for folder permissions (`canUseTeams`). Reset it in `afterEach`. */
export const folderTeams = { enabled: false };

/** How many times `listFolderLevelPermissions` ran. Reset it in `afterEach`. */
export const folderPermissionLists = { count: 0 };

export const toFolderPermissions = (levels: Map<string, FolderAccessLevel>): FolderPermission[] => {
    return [...levels.entries()].map(([userId, level]) => {
        return { target: `admin:${userId}`, level };
    });
};

/** One entry of `IFolderLevelPermissions.listFolderLevelPermissions` (structurally identical). */
interface FolderPermissionsListItem {
    id: string;
    permissions: FolderPermission[];
}

/**
 * FLP that is on for admin identities (like the real one) and decides with the real ACO
 * `CanAccessFolderContent`; folder permissions come from `folderLevels` (A28).
 */
class FakeFolderLevelPermissionsImpl implements FolderLevelPermissions.Interface {
    public constructor(private identityContext: IdentityContext.Interface) {}

    public canUseFolderLevelPermissions(enabled?: boolean): boolean {
        if (enabled === false) {
            return false;
        }
        return this.identityContext.getIdentity().type === "admin";
    }

    public canUseTeams(): boolean {
        return folderTeams.enabled;
    }

    public canCreateFolderInRoot(): boolean {
        return true;
    }

    public permissionsIncludeNonInheritedPermissions(): boolean {
        return false;
    }

    public async canAccessFolder(): Promise<boolean> {
        return true;
    }

    public async canAccessFolderContent(params: CanAccessFolderContentParams): Promise<boolean> {
        return new CanAccessFolderContent(this.identityContext).execute(params);
    }

    public async ensureCanAccessFolder(): Promise<void> {
        return;
    }

    public async ensureCanAccessFolderContent(): Promise<void> {
        return;
    }

    public async canManageFolderContent(): Promise<boolean> {
        return true;
    }

    public async canManageFolderStructure(): Promise<boolean> {
        return true;
    }

    public async canManageFolderPermissions(): Promise<boolean> {
        return true;
    }

    /** A folder without permissions gives the current identity `owner`, as unlisted folders do. */
    public async getDefaultPermissions(
        permissions: FolderPermission[]
    ): Promise<FolderPermission[]> {
        if (permissions.length === 0) {
            const identity = this.identityContext.getIdentity();
            return [{ target: `admin:${identity.id}`, level: "owner" }];
        }
        return permissions;
    }

    /**
     * Every folder of `folderLevels`, whatever the type: the fake keeps no folder types. Like the
     * ACO storage, a list needs `parentId` or `path_startsWith` next to the type.
     */
    public async listFolderLevelPermissions(
        params: ListFlpsParams
    ): Promise<FolderPermissionsListItem[]> {
        if (!params.where.parentId && !params.where.path_startsWith) {
            throw new Error("Missing required parameters.");
        }
        folderPermissionLists.count++;
        return [...folderLevels.entries()].map(([id, levels]) => {
            return { id, permissions: toFolderPermissions(levels) };
        });
    }

    public async getFolderLevelPermissions(id: string): Promise<FolderPermission[]> {
        const levels = folderLevels.get(id);
        if (!levels) {
            const identity = this.identityContext.getIdentity();
            return [{ target: `admin:${identity.id}`, level: "owner" }];
        }
        return toFolderPermissions(levels);
    }
}

export const FakeFolderLevelPermissions = FolderLevelPermissions.createImplementation({
    implementation: FakeFolderLevelPermissionsImpl,
    dependencies: [IdentityContext]
});
