import { createAbstraction } from "@webiny/feature/api";
import type { CanAccessFolderContentParams, CanAccessFolderParams } from "./useCases/index.js";
import type { FolderLevelPermission, FolderPermission } from "~/types.js";
import type { ListFolderPermissionsParams } from "~/features/flp/FolderPermissionsRepository/abstractions.js";

export interface IFolderLevelPermissions {
    canUseFolderLevelPermissions(enabled?: boolean): boolean;
    canUseTeams(): boolean;
    canCreateFolderInRoot(): boolean;
    permissionsIncludeNonInheritedPermissions(permissions: FolderPermission[]): boolean;
    canAccessFolder(params: CanAccessFolderParams): Promise<boolean>;
    canAccessFolderContent(params: CanAccessFolderContentParams): Promise<boolean>;
    ensureCanAccessFolder(params: CanAccessFolderParams): Promise<void>;
    ensureCanAccessFolderContent(params: CanAccessFolderContentParams): Promise<void>;
    canManageFolderContent(flp: FolderLevelPermission): Promise<boolean>;
    canManageFolderStructure(flp: FolderLevelPermission): Promise<boolean>;
    canManageFolderPermissions(flp: FolderLevelPermission): Promise<boolean>;
    getDefaultPermissions(permissions: FolderPermission[]): Promise<FolderPermission[]>;
    /**
     * `getDefaultPermissions` for many folders at once: the identity's teams and permissions are
     * looked up once, not once per folder. Results are in the order of the input.
     */
    getDefaultPermissionsBatch(
        permissionsList: FolderPermission[][]
    ): Promise<FolderPermission[][]>;
    listFolderLevelPermissions(params: ListFolderPermissionsParams): Promise<
        Array<{
            id: string;
            permissions: FolderPermission[];
        }>
    >;
    getFolderLevelPermissions(id: string): Promise<FolderPermission[]>;
}

/** Manage folder-level access control. */
export const FolderLevelPermissions =
    createAbstraction<IFolderLevelPermissions>("FolderLevelPermissions");

export namespace FolderLevelPermissions {
    export type Interface = IFolderLevelPermissions;
}
