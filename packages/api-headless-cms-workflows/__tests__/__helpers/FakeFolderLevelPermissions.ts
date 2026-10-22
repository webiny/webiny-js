import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import {
    CanAccessFolderContent,
    type CanAccessFolderContentParams
} from "@webiny/api-aco/features/flp/FolderLevelPermissions/useCases/index.js";
import type { FolderAccessLevel, FolderPermission } from "@webiny/api-aco/types.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

/**
 * Folder id → user id → access level. Folders not listed give the current identity `owner`.
 * Reset it in `afterEach`.
 */
export const folderLevels = new Map<string, Map<string, FolderAccessLevel>>();

/** How many times `listFolderLevelPermissions` ran. Reset it in `afterEach`. */
export const folderPermissionLists = { count: 0 };

const toFolderPermissions = (levels: Map<string, FolderAccessLevel>): FolderPermission[] => {
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
        return false;
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

    public async getDefaultPermissions(
        permissions: FolderPermission[]
    ): Promise<FolderPermission[]> {
        return permissions;
    }

    /** Every folder of `folderLevels`, whatever the type: the fake keeps no folder types. */
    public async listFolderLevelPermissions(): Promise<FolderPermissionsListItem[]> {
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
