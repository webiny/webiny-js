import { Authentication } from "@webiny/api-authentication/types";
import { SecurityPermission, Team } from "@webiny/api-security/types";
import { Folder } from "~/folder/folder.types";
import { NotAuthorizedError } from "@webiny/api-security";

export type FolderAccessLevel = "owner" | "viewer" | "editor" | "public";

export interface FolderPermission {
    target: string;
    level: FolderAccessLevel;
    inheritedFrom: string | null;
    originallyInheritedFrom: string | null;
}

export interface FolderPermissionsListItem {
    folderId: string;
    permissions: FolderPermission[];
}

export type FolderPermissionsList = FolderPermissionsListItem[];

export interface CanAccessFolderContentParams {
    folder: Pick<Folder, "id" | "type" | "parentId">;
    rwd?: "r" | "w" | "d";
    foldersList?: Folder[];
}

export interface CanAccessFolderParams extends CanAccessFolderContentParams {
    managePermissions?: boolean;
}

interface FilterFoldersParams {
    folders: Array<Folder>;
    rwd?: "r" | "w" | "d";
}

interface GetFolderPermissionsParams {
    folder: Pick<Folder, "id" | "type">;
    foldersList?: Folder[];
}

interface ListFolderPermissionsParams {
    folderType: string;
    foldersList?: Folder[];
}

export interface FolderLevelPermissionsParams {
    getIdentity: Authentication["getIdentity"];
    getIdentityTeam: () => Promise<Team | null>;
    listPermissions: () => Promise<SecurityPermission[]>;
    listAllFolders: (folderType: string) => Promise<Folder[]>;
    canUseTeams: () => boolean;
    canUseFolderLevelPermissions: () => boolean;
    isAuthorizationEnabled: () => boolean;
}

export class FolderLevelPermissions {
    private readonly getIdentity: Authentication["getIdentity"];
    private readonly getIdentityTeam: () => Promise<Team | null>;
    private readonly listPermissions: () => Promise<SecurityPermission[]>;
    private readonly listAllFoldersCallback: (folderType: string) => Promise<Folder[]>;
    private readonly canUseTeams: () => boolean;
    private readonly canUseFolderLevelPermissions: () => boolean;
    private readonly isAuthorizationEnabled: () => boolean;
    private allFolders: Record<string, Folder[]> = {};
    private foldersPermissionsLists: Record<string, Promise<FolderPermissionsList> | null> = {};

    constructor(params: FolderLevelPermissionsParams) {
        this.getIdentity = params.getIdentity;
        this.getIdentityTeam = params.getIdentityTeam;
        this.listPermissions = params.listPermissions;
        this.listAllFoldersCallback = params.listAllFolders;
        this.canUseTeams = params.canUseTeams;
        this.canUseFolderLevelPermissions = () => {
            const identity = this.getIdentity();

            // FLPs only work with authenticated identities (logged-in users).
            if (!identity) {
                return false;
            }

            // At the moment, we only want FLP to be used with identities of type "admin".
            // This temporarily addresses the issue of API keys not being able to access content, because
            // FLPs doesn't work with them. Once we start adding FLPs to API keys, we can remove this check.
            if (identity.type !== "admin") {
                return false;
            }

            return params.canUseFolderLevelPermissions();
        };

        this.isAuthorizationEnabled = params.isAuthorizationEnabled;
    }

    async listAllFolders(folderType: string): Promise<Folder[]> {
        if (folderType in this.allFolders) {
            return structuredClone(this.allFolders[folderType]);
        }

        this.allFolders[folderType] = await this.listAllFoldersCallback(folderType);
        return structuredClone(this.allFolders[folderType]);
    }

    async listAllFoldersWithPermissions(folderType: string) {
        const folders = await this.listAllFolders(folderType);

        // Filter folders based on permissions and assign permissions to each folder.
        const filteredFoldersWithPermissions = await this.filterFolders({
            folders,
            rwd: "r"
        });

        await this.assignFolderPermissions(filteredFoldersWithPermissions);

        return filteredFoldersWithPermissions;
    }

    invalidateFoldersCache(folderType?: string) {
        if (folderType) {
            if (folderType in this.allFolders) {
                delete this.allFolders[folderType];
            }
        } else {
            this.allFolders = {};
        }
    }

    invalidateFoldersPermissionsListCache(folderType?: string) {
        if (folderType) {
            if (folderType in this.foldersPermissionsLists) {
                delete this.foldersPermissionsLists[folderType];
            }
        } else {
            this.allFolders = {};
        }
    }

    updateFoldersCache(folderType: string, modifier: (folders: Folder[]) => Folder[]) {
        const foldersClone = structuredClone(this.allFolders[folderType]) || [];
        this.allFolders[folderType] = modifier(foldersClone);
    }

    async listFoldersPermissions(
        params: ListFolderPermissionsParams
    ): Promise<FolderPermissionsList> {
        const existingFoldersPermissionsList = this.foldersPermissionsLists[params.folderType];
        if (existingFoldersPermissionsList) {
            return existingFoldersPermissionsList;
        }

        this.foldersPermissionsLists[params.folderType] = new Promise(async resolve => {
            if (!this.canUseFolderLevelPermissions() || !this.isAuthorizationEnabled()) {
                resolve([]);
                return;
            }

            const { folderType, foldersList } = params;

            const allFolders = foldersList || (await this.listAllFolders(folderType));
            const identity = this.getIdentity();
            const permissions = await this.listPermissions();

            let identityTeam: Team | null;
            if (this.canUseTeams()) {
                identityTeam = await this.getIdentityTeam();
            }

            const allFolderPermissions: FolderPermissionsListItem[] = [];

            const processFolderPermissions = (folder: Folder) => {
                if (allFolderPermissions.some(fp => fp.folderId === folder.id)) {
                    return;
                }

                // Copy permissions, so we don't modify the original object.
                const currentFolderPermissions: FolderPermissionsListItem = {
                    folderId: folder.id,
                    // On new folders, permissions can be `null`. Guard against that.
                    permissions: folder.permissions?.map(permission => ({ ...permission })) || []
                };

                const isRootFolder = !folder.parentId;

                // Check for permissions inherited from parent folder.
                if (isRootFolder) {
                    const currentFolderHasPermissions =
                        currentFolderPermissions.permissions.length > 0;

                    const isPublicFolder = !currentFolderHasPermissions;
                    if (isPublicFolder) {
                        currentFolderPermissions.permissions = [
                            {
                                target: `admin:${identity.id}`,
                                level: "public",
                                inheritedFrom: "public",
                                originallyInheritedFrom: "public"
                            }
                        ];
                    }

                    const hasFullAccess = permissions.some(p => p.name === "*");
                    if (hasFullAccess) {
                        currentFolderPermissions.permissions.unshift({
                            target: `admin:${identity.id}`,
                            level: "owner",
                            inheritedFrom: "role:full-access",
                            originallyInheritedFrom: "role:full-access"
                        });
                    }
                } else {
                    const parentFolder = allFolders!.find(f => f.id === folder.parentId)!;
                    if (!parentFolder) {
                        throw new Error(`Parent folder not found for folder "${folder.id}".`);
                    }

                    // First check if the parent folder has already been processed.
                    let parentFolderPermissions = allFolderPermissions.find(
                        fp => fp.folderId === parentFolder.id
                    );

                    // If not, process the parent folder.
                    if (!parentFolderPermissions) {
                        processFolderPermissions(parentFolder);
                        parentFolderPermissions = allFolderPermissions.find(
                            fp => fp.folderId === folder.parentId
                        )!;
                    }

                    // Target-unique permissions from the parent folder.
                    const permissionsByTarget: Record<string, any> = {};
                    parentFolderPermissions.permissions.forEach(p => {
                        if (!permissionsByTarget[p.target]) {
                            permissionsByTarget[p.target] = { parentFolder: [], currentFolder: [] };
                        }

                        permissionsByTarget[p.target].parentFolder.push(p);
                    });

                    currentFolderPermissions.permissions.forEach(p => {
                        if (!permissionsByTarget[p.target]) {
                            permissionsByTarget[p.target] = { parentFolder: [], currentFolder: [] };
                        }

                        permissionsByTarget[p.target].currentFolder.push(p);
                    });

                    // PARENT-CHILD MERGING LOGIC
                    const parentPermissions = parentFolderPermissions.permissions;
                    const currentPermissions = currentFolderPermissions.permissions;
                    const mergedPermissions: FolderPermission[] = [];

                    //
                    //
                    // const inheritedParentFolderPermissions: FolderPermission[] = [];
                    //
                    // // Target-unique permissions from the parent folder.
                    // const parentFolderPermissionsMap = new Map<string, FolderPermission>();
                    // parentFolderPermissions.permissions.forEach(p => {
                    //     parentFolderPermissionsMap.set(p.target, p);
                    // });
                    //
                    // parentFolderPermissionsMap.forEach((p, key) => {
                    //
                    // });
                    //
                    // parentFolderPermissions.permissions.forEach(p => {
                    //     // We don't inherit "public" permission from the parent folder if
                    //     // the current folder already has some permissions set.
                    //     const isPublicPermission = p.level === "public";
                    //     if (isPublicPermission) {
                    //         // If the current folder already has some permissions set, we skip
                    //         // inheriting the "public" permission from the parent folder.
                    //         const canInheritPublicPermission =
                    //             currentFolderPermissions.permissions.length === 0;
                    //         if (canInheritPublicPermission) {
                    //             return;
                    //         }
                    //     }
                    //
                    //
                    //     inheritedParentFolderPermissions.push({
                    //         ...p,
                    //         inheritedFrom: "parent:" + parentFolderPermissions!.folderId
                    //     });
                    // });

                    // Inherit parent folder permissions.
                    currentFolderPermissions.permissions.push(...inheritedParentFolderPermissions);
                }

                // TODO: handle teams
                // if (identityTeam) {
                //     currentFolderPermissions.permissions.forEach(p => {
                //         if (p.target !== `team:${identityTeam!.id}`) {
                //             return;
                //         }
                //
                //         currentFolderPermissions.permissions.unshift({
                //             target: `admin:${identity.id}`,
                //             level: p.level,
                //             inheritedFrom: "team:" + identityTeam!.id
                //         });
                //     });
                // }

                allFolderPermissions.push(currentFolderPermissions);
            };

            for (let i = 0; i < allFolders!.length; i++) {
                const folder = allFolders![i];
                processFolderPermissions(folder);
            }

            resolve(allFolderPermissions);
            return;
        });

        return this.foldersPermissionsLists[params.folderType]!;
    }

    async getFolderPermissions(
        params: GetFolderPermissionsParams
    ): Promise<FolderPermissionsListItem | undefined> {
        const { folder, foldersList } = params;
        const folderPermissionsList = await this.listFoldersPermissions({
            folderType: folder.type,
            foldersList
        });

        return folderPermissionsList.find(fp => fp.folderId === folder.id);
    }

    async mergeFolderPermissions(folderPermissions: FolderPermissionsListItem) {
        // Check if public.
        const publicPermissions = folderPermissions.permissions.some(p => p.level === "public");
        if (publicPermissions) {
            return publicPermissions;
        }

        const identityPermissions = await this.listPermissions();
        const hasFullAccess = identityPermissions.some(p => p.name === "*");
        if (hasFullAccess) {
            const identity = this.getIdentity();
            return {
                target: `admin:${identity.id}`,
                level: "owner",
                inheritedFrom: "role:full-access"
            };
        }

        const permissions: FolderPermission[] = [];

        const inheritedPermissions = folderPermissions.permissions.filter(p => p.inheritedFrom);
        const directPermissions = folderPermissions.permissions.filter(p => !p.inheritedFrom);

        for (let i = 0; i < inheritedPermissions.length; i++) {
            const inheritedPermission = inheritedPermissions[i];
        }

        return permissions;
    }

    async canAccessFolder(params: CanAccessFolderParams) {
        if (!this.canUseFolderLevelPermissions() || !this.isAuthorizationEnabled()) {
            return true;
        }

        const { folder } = params;

        const folderPermissions = await this.getFolderPermissions({
            folder,
            foldersList: params.foldersList
        });

        const identity = this.getIdentity();
        const currentIdentityPermissions =
            folderPermissions?.permissions.filter(p => {
                return p.target === `admin:${identity.id}`;
            }) || [];

        if (currentIdentityPermissions.length === 0) {
            return false;
        }

        // level + inheritedFrom... user > team.... direct > inherited
        const { level } = currentIdentityPermissions;

        if (params.managePermissions) {
            return level === "owner";
        }

        // Checking for "write" or "delete" access. Allow only if the
        // user is an owner or the folder is public (no FLP assigned).
        if (params.rwd !== "r") {
            return level === "owner" || level === "public";
        }

        return true;
    }

    async ensureCanAccessFolder(params: CanAccessFolderParams) {
        const canAccessFolder = await this.canAccessFolder(params);
        if (!canAccessFolder) {
            throw new NotAuthorizedError();
        }
    }

    canManageFolderPermissions(folder: Folder) {
        if (!this.canUseFolderLevelPermissions()) {
            return false;
        }

        if (!this.isAuthorizationEnabled()) {
            return true;
        }

        return this.canAccessFolder({ folder, rwd: "w", managePermissions: true });
    }

    canManageFolderStructure(folder: Folder) {
        if (!this.canUseFolderLevelPermissions() || !this.isAuthorizationEnabled()) {
            return true;
        }

        return this.canAccessFolder({ folder, rwd: "w" });
    }

    canManageFolderContent(folder: Folder) {
        if (!this.canUseFolderLevelPermissions() || !this.isAuthorizationEnabled()) {
            return true;
        }

        return this.canAccessFolderContent({ folder, rwd: "w" });
    }

    async canAccessFolderContent(params: CanAccessFolderContentParams) {
        if (!this.canUseFolderLevelPermissions() || !this.isAuthorizationEnabled()) {
            return true;
        }

        const { folder, foldersList } = params;

        const folderPermissions = await this.getFolderPermissions({
            folder,
            foldersList
        });

        const identity = this.getIdentity();
        const currentIdentityPermission = folderPermissions?.permissions.find(p => {
            return p.target === `admin:${identity.id}`;
        });

        if (!currentIdentityPermission) {
            return false;
        }

        // If the user is not an owner and we're checking for "write" or
        // "delete" access, then we can immediately return false.
        if (params.rwd !== "r") {
            const { level } = currentIdentityPermission;
            return level !== "viewer";
        }

        return true;
    }

    async ensureCanAccessFolderContent(params: CanAccessFolderContentParams) {
        const canAccessFolderContent = await this.canAccessFolderContent(params);
        if (!canAccessFolderContent) {
            throw new NotAuthorizedError();
        }
    }

    async canCreateFolderInRoot() {
        return true;
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
            const folderPermissions = await this.getFolderPermissions({ folder });
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

    generatePermissionId() {
        return "p" + Math.random().toString(36).substr(2, 9);
    }
}
