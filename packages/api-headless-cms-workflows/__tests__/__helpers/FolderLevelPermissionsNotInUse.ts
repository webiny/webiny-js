import type { Container } from "@webiny/di";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import type {
    CanAccessFolderContentParams,
    CanAccessFolderParams
} from "@webiny/api-aco/features/flp/FolderLevelPermissions/useCases/index.js";
import type {
    FolderLevelPermission,
    FolderPermission,
    ListFlpsParams
} from "@webiny/api-aco/types.js";

/** One entry of `IFolderLevelPermissions.listFolderLevelPermissions` (structurally identical). */
interface FolderPermissionsListItem {
    id: string;
    permissions: FolderPermission[];
}

/**
 * FLP that is not in use for any identity (as for an API key), while every folder decision still
 * comes from the decorated FLP: a caller that skips the check is told apart from one that asks.
 */
class FolderLevelPermissionsNotInUse implements FolderLevelPermissions.Interface {
    public constructor(private decoratee: FolderLevelPermissions.Interface) {}

    public canUseFolderLevelPermissions(): boolean {
        return false;
    }

    public canUseTeams(): boolean {
        return this.decoratee.canUseTeams();
    }

    public canCreateFolderInRoot(): boolean {
        return this.decoratee.canCreateFolderInRoot();
    }

    public permissionsIncludeNonInheritedPermissions(permissions: FolderPermission[]): boolean {
        return this.decoratee.permissionsIncludeNonInheritedPermissions(permissions);
    }

    public canAccessFolder(params: CanAccessFolderParams): Promise<boolean> {
        return this.decoratee.canAccessFolder(params);
    }

    public canAccessFolderContent(params: CanAccessFolderContentParams): Promise<boolean> {
        return this.decoratee.canAccessFolderContent(params);
    }

    public ensureCanAccessFolder(params: CanAccessFolderParams): Promise<void> {
        return this.decoratee.ensureCanAccessFolder(params);
    }

    public ensureCanAccessFolderContent(params: CanAccessFolderContentParams): Promise<void> {
        return this.decoratee.ensureCanAccessFolderContent(params);
    }

    public canManageFolderContent(flp: FolderLevelPermission): Promise<boolean> {
        return this.decoratee.canManageFolderContent(flp);
    }

    public canManageFolderStructure(flp: FolderLevelPermission): Promise<boolean> {
        return this.decoratee.canManageFolderStructure(flp);
    }

    public canManageFolderPermissions(flp: FolderLevelPermission): Promise<boolean> {
        return this.decoratee.canManageFolderPermissions(flp);
    }

    public getDefaultPermissions(permissions: FolderPermission[]): Promise<FolderPermission[]> {
        return this.decoratee.getDefaultPermissions(permissions);
    }

    public listFolderLevelPermissions(
        params: ListFlpsParams
    ): Promise<FolderPermissionsListItem[]> {
        return this.decoratee.listFolderLevelPermissions(params);
    }

    public getFolderLevelPermissions(id: string): Promise<FolderPermission[]> {
        return this.decoratee.getFolderLevelPermissions(id);
    }
}

/** Folder-level permissions are not in use for any identity (`legacyPlugins`, after the fake FLP). */
export const disableFolderLevelPermissions = (container: Container) => {
    container.registerDecorator(
        FolderLevelPermissions.createDecorator({
            decorator: FolderLevelPermissionsNotInUse,
            dependencies: []
        })
    );
};
