import { Authentication } from "@webiny/api-authentication/types";
import { SecurityPermission, Team } from "@webiny/api-security/types";
import { Folder } from "~/folder/folder.types";

export type FolderAccessLevel = "owner" | "viewer" | "editor";

export interface FolderPermission {
    target: string;
    level: FolderAccessLevel;
    inheritedFrom?: string;
}

export interface FolderPermissions {
    folderId: string;
    permissions: FolderPermission[];
}

export type FolderPermissionsList = FolderPermissions[];

export interface CanAccessFolderParams {
    folder: Folder;
    rwd?: "r" | "w" | "d";
}

interface FilterFoldersParams {
    folders: Array<Folder>;
    rwd?: "r" | "w" | "d";
}

export interface FolderLevelPermissionsParams {
    getIdentity: Authentication["getIdentity"];
    getIdentityTeam: () => Promise<Team | null>;
    listPermissions: () => Promise<SecurityPermission[]>;
    listAllFolders: (folderType: string) => Promise<Folder[]>;
    canUseTeams: () => boolean;
    canUseFolderLevelPermissions: () => boolean;
}

export class FolderLevelPermissions {
    private readonly getIdentity: Authentication["getIdentity"];
    private readonly getIdentityTeam: () => Promise<Team | null>;
    private readonly listPermissions: () => Promise<SecurityPermission[]>;
    private readonly listAllFoldersCallback: (folderType: string) => Promise<Folder[]>;
    private readonly canUseTeams: () => boolean;
    private readonly canUseFolderLevelPermissions: () => boolean;
    private allFolders: Record<string, Folder[]> = {};

    constructor(params: FolderLevelPermissionsParams) {
        this.getIdentity = params.getIdentity;
        this.getIdentityTeam = params.getIdentityTeam;
        this.listPermissions = params.listPermissions;
        this.listAllFoldersCallback = params.listAllFolders;
        this.canUseTeams = params.canUseTeams;
        this.canUseFolderLevelPermissions = params.canUseFolderLevelPermissions;
    }

    async listAllFolders(folderType: string) {
        if (folderType in this.allFolders) {
            return this.allFolders[folderType];
        }

        this.allFolders[folderType] = await this.listAllFoldersCallback(folderType);
        return this.allFolders[folderType];
    }

    invalidateCache(folderType?: string) {
        if (folderType) {
            if (folderType in this.allFolders) {
                delete this.allFolders[folderType];
            }
        } else {
            this.allFolders = {};
        }
    }

    async listFoldersPermissions(folderType: string): Promise<FolderPermissionsList> {
        if (!this.canUseFolderLevelPermissions()) {
            return [];
        }

        const allFolders = await this.listAllFolders(folderType);
        const identity = this.getIdentity();
        const permissions = await this.listPermissions();

        const processedFolderPermissions: FolderPermissions[] = [];

        const processFolderPermissions = (folder: Folder) => {
            if (processedFolderPermissions.some(fp => fp.folderId === folder.id)) {
                return;
            }

            // Copy permissions, so we don't modify the original object.
            const currentFolderPermissions: FolderPermissions = {
                folderId: folder.id,
                // On new folders, permissions can be `null`. Guard against that.
                permissions: folder.permissions?.map(permission => ({ ...permission })) || []
            };

            // Check for permissions inherited from parent folder.
            if (folder.parentId) {
                const parentFolder = allFolders!.find(f => f.id === folder.parentId)!;
                if (parentFolder) {
                    // First check if the parent folder has already been processed.
                    let processedParentFolderPermissions = processedFolderPermissions.find(
                        fp => fp.folderId === parentFolder.id
                    );

                    // If not, process the parent folder.
                    if (!processedParentFolderPermissions) {
                        processFolderPermissions(parentFolder);
                        processedParentFolderPermissions = processedFolderPermissions.find(
                            fp => fp.folderId === folder.parentId
                        );
                    }

                    // If the parent folder has permissions, let's add them to the current folder.
                    if (processedParentFolderPermissions) {
                        const inheritedPermissions =
                            processedParentFolderPermissions.permissions.map(p => {
                                return {
                                    ...p,
                                    inheritedFrom:
                                        "parent:" + processedParentFolderPermissions!.folderId
                                };
                            });

                        currentFolderPermissions.permissions.push(...inheritedPermissions);
                    }
                }
            }

            // Finally, let's also ensure that the current user is included in the permissions,
            // if not already. Let's also ensure the user is the first item in the array.
            const [firstPermission] = currentFolderPermissions.permissions;

            // If current identity is already listed as the first permission, we don't need to do anything.
            const identityFirstPermission = firstPermission?.target === `admin:${identity.id}`;

            if (!identityFirstPermission) {
                const currentIdentityPermissionIndex =
                    currentFolderPermissions.permissions.findIndex(
                        p => p.target === `admin:${identity.id}`
                    );

                if (currentIdentityPermissionIndex >= 0) {
                    const [identityPermission] = currentFolderPermissions.permissions.splice(
                        currentIdentityPermissionIndex,
                        1
                    );
                    currentFolderPermissions.permissions.unshift(identityPermission);
                } else {
                    // If the current identity is not in the permissions, let's add it.
                    // If the user has full access, we'll add it as "owner".
                    const hasFullAccess = permissions.some(p => p.name === "*");
                    if (hasFullAccess) {
                        currentFolderPermissions.permissions.unshift({
                            target: `admin:${identity.id}`,
                            level: "owner",
                            inheritedFrom: "role:full-access"
                        });
                    }
                }
            }

            processedFolderPermissions.push(currentFolderPermissions);
        };

        for (let i = 0; i < allFolders!.length; i++) {
            const folder = allFolders![i];
            processFolderPermissions(folder);
        }

        return processedFolderPermissions;
    }

    async getFolderPermissions(folder: Folder): Promise<FolderPermissions | undefined> {
        const folderPermissionsList = await this.listFoldersPermissions(folder.type);
        return folderPermissionsList.find(fp => fp.folderId === folder.id);
    }

    async canAccessFolder(params: CanAccessFolderParams) {
        if (!this.canUseFolderLevelPermissions()) {
            return true;
        }

        const { folder } = params;

        const folderPermissions = await this.getFolderPermissions(folder);

        const identity = this.getIdentity();

        const userAccessLevel = folderPermissions?.permissions.find(
            p => p.target === "admin:" + identity.id
        )?.level;

        let teamAccessLevel: FolderAccessLevel | undefined;

        if (this.canUseTeams()) {
            const identityTeam = await this.getIdentityTeam();
            if (identityTeam) {
                teamAccessLevel = folderPermissions?.permissions.find(
                    p => p.target === "team:" + identityTeam.id
                )?.level;
            }
        }

        const accessLevels = [userAccessLevel, teamAccessLevel].filter(Boolean);

        if (params.rwd !== "r") {
            return accessLevels.includes("owner");
        }

        // If we are here, it means we are checking for "read" access.
        // For starters, let's check if the user has any access level.
        if (accessLevels.length > 0) {
            return true;
        }

        // If the user doesn't have any access level, let's check if the folder has any permissions set.
        // Folders that don't have any permissions set are considered "public".
        const hasPermissions = folderPermissions && folderPermissions.permissions.length > 0;
        if (!hasPermissions) {
            return true;
        }

        // No conditions were met, so we can return false.
        return false;
    }

    async canAccessFolderContent(params: CanAccessFolderParams) {
        if (!this.canUseFolderLevelPermissions()) {
            return true;
        }

        const { folder } = params;

        const folderPermissions = await this.getFolderPermissions(folder);

        const identity = this.getIdentity();

        const userAccessLevel = folderPermissions?.permissions.find(
            p => p.target === "admin:" + identity.id
        )?.level;

        let teamAccessLevel: FolderAccessLevel | undefined;
        if (this.canUseTeams()) {
            const identityTeam = await this.getIdentityTeam();
            if (identityTeam) {
                teamAccessLevel = folderPermissions?.permissions.find(
                    p => p.target === "team:" + identityTeam.id
                )?.level;
            }
        }

        const accessLevels = [userAccessLevel, teamAccessLevel].filter(Boolean);

        // If the user is not an owner and we're checking for "write" or
        // "delete" access, then we can immediately return false.
        if (params.rwd !== "r") {
            return accessLevels.includes("owner") || accessLevels.includes("editor");
        }

        // If we are here, it means we are checking for "read" access.
        // For starters, let's check if the user has any access level.
        if (accessLevels.length > 0) {
            return true;
        }

        // If the user doesn't have any access level, let's check if the folder has any permissions set.
        // Folders that don't have any permissions set are considered "public".
        const hasPermissions = folderPermissions && folderPermissions.permissions.length > 0;
        if (!hasPermissions) {
            return true;
        }

        // No conditions were met, so we can return false.
        return false;
    }

    async canCreateFolderInRoot() {
        if (!this.canUseFolderLevelPermissions()) {
            return true;
        }

        const permissions = await this.listPermissions();
        return permissions.some(p => p.name === "*");
    }

    async filterFolders(params: FilterFoldersParams) {
        const filteredFolders: Folder[] = [];

        const { folders, rwd } = params;
        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];
            const canAccessFolder = await this.canAccessFolder({ folder, rwd });
            if (canAccessFolder) {
                filteredFolders.push(folder);
            }
        }

        return filteredFolders;
    }

    async assignFolderPermissions(folder: Folder | Folder[]) {
        const folders = Array.isArray(folder) ? folder : [folder];

        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];
            const folderPermissions = await this.getFolderPermissions(folder);
            if (folderPermissions) {
                folder.permissions = folderPermissions.permissions;
            } else {
                folder.permissions = [];
            }
        }
    }

    permissionsIncludeNonInheritedPermissions(folderPermissionsList?: FolderPermission[]) {
        return folderPermissionsList?.some(p => !p.inheritedFrom);
    }
}
