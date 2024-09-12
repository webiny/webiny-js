import { Authentication } from "@webiny/api-authentication/types";
import { SecurityPermission, Team } from "@webiny/api-security/types";
import { Folder } from "~/folder/folder.types";
import { NotAuthorizedError } from "@webiny/api-security";

export type FolderAccessLevel = "owner" | "viewer" | "editor" | "public";

export interface FolderPermission {
    target: string;
    level: FolderAccessLevel;
    inheritedFrom?: string;
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
    listIdentityTeams: () => Promise<Team[]>;
    listPermissions: () => Promise<SecurityPermission[]>;
    listAllFolders: (folderType: string) => Promise<Folder[]>;
    canUseTeams: () => boolean;
    canUseFolderLevelPermissions: () => boolean;
    isAuthorizationEnabled: () => boolean;
}

export class FolderLevelPermissions {
    canUseFolderLevelPermissions: () => boolean;

    private readonly getIdentity: Authentication["getIdentity"];
    private readonly listIdentityTeams: () => Promise<Team[]>;
    private readonly listPermissions: () => Promise<SecurityPermission[]>;
    private readonly listAllFoldersCallback: (folderType: string) => Promise<Folder[]>;
    private readonly canUseTeams: () => boolean;
    private readonly isAuthorizationEnabled: () => boolean;
    private allFolders: Record<string, Folder[]> = {};
    private foldersPermissionsLists: Record<string, Promise<FolderPermissionsList> | null> = {};

    constructor(params: FolderLevelPermissionsParams) {
        this.getIdentity = params.getIdentity;
        this.listIdentityTeams = params.listIdentityTeams;
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

            let identityTeams: Team[];
            if (this.canUseTeams()) {
                identityTeams = await this.listIdentityTeams();
            }

            const processedFolderPermissions: FolderPermissionsListItem[] = [];

            const processFolderPermissions = (folder: Folder) => {
                if (processedFolderPermissions.some(fp => fp.folderId === folder.id)) {
                    return;
                }

                // Copy permissions, so we don't modify the original object.
                const currentFolderPermissions: FolderPermissionsListItem = {
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
                            const isPublicParentFolder =
                                processedParentFolderPermissions.permissions.some(
                                    p => p.level === "public"
                                );

                            // We inherit parent permissions if:
                            // 1. the parent folder is not public or...
                            // 2. ...the parent folder is public, but the current folder doesn't have any permissions set
                            const mustInherit =
                                !isPublicParentFolder ||
                                currentFolderPermissions.permissions.length === 0;

                            if (mustInherit) {
                                const inheritedPermissions =
                                    processedParentFolderPermissions.permissions.map(p => {
                                        return {
                                            ...p,
                                            inheritedFrom:
                                                "parent:" +
                                                processedParentFolderPermissions!.folderId
                                        };
                                    });

                                currentFolderPermissions.permissions.push(...inheritedPermissions);
                            }
                        }
                    }
                }

                // Let's ensure current identity's permission is included in the permissions array.
                // We first check if the current identity is already included in the permissions array.
                // If not, we check if the user has full access or if the team user belongs to has access.
                const currentIdentityIncludedInPermissions =
                    currentFolderPermissions.permissions.some(
                        p => p.target === `admin:${identity.id}`
                    );

                const hasFullAccess = permissions.some(p => p.name === "*");

                if (currentIdentityIncludedInPermissions) {
                    // 1. Ensure existing identity permission is always the first one in the array.
                    const currentIdentityPermissionIndex =
                        currentFolderPermissions.permissions.findIndex(
                            p => p.target === `admin:${identity.id}`
                        );

                    if (currentIdentityPermissionIndex > 0) {
                        const [currentIdentityPermission] =
                            currentFolderPermissions.permissions.splice(
                                currentIdentityPermissionIndex,
                                1
                            );
                        currentFolderPermissions.permissions.unshift(currentIdentityPermission);
                    }

                    // 2. We must ensure current identity has the "owner" level if they possess full access
                    // based on security permissions. This protects us from non-full-access users restricting
                    // access to full-access users. This should not happen. Full-access users should always
                    // be in control of the permissions for a folder.
                    if (hasFullAccess) {
                        const accessInheritedFrom =
                            currentFolderPermissions.permissions[0].inheritedFrom;

                        // Why are we checking for non-existence of `accessInheritedFrom`?
                        // Because if it doesn't exist, it means the permission is not inherited from
                        // a parent folder, which means it's a direct permission set on the folder.
                        // In this case, we must ensure the permission is set to "owner".
                        if (!accessInheritedFrom) {
                            currentFolderPermissions.permissions[0] = {
                                target: `admin:${identity.id}`,
                                level: "owner",
                                inheritedFrom: "role:full-access"
                            };
                        }
                    }
                } else {
                    // Current identity not included in permissions? Let's add it.
                    let currentIdentityPermission: FolderPermission | null = null;

                    // 1. Check if the user has full access.
                    if (hasFullAccess) {
                        currentIdentityPermission = {
                            target: `admin:${identity.id}`,
                            level: "owner",
                            inheritedFrom: "role:full-access"
                        };
                    } else if (identityTeams.length) {
                        // 2. Check the teams user belongs to and that grant access to the folder.
                        for (const identityTeam of identityTeams) {
                            const teamPermission = currentFolderPermissions.permissions.find(
                                p => p.target === `team:${identityTeam!.id}`
                            );

                            if (teamPermission) {
                                currentIdentityPermission = {
                                    target: `admin:${identity.id}`,
                                    level: teamPermission.level,
                                    inheritedFrom: "team:" + identityTeam!.id
                                };
                            }
                        }
                    }

                    if (currentIdentityPermission) {
                        // If permission is found, let's add it to the beginning of the array.
                        // We're doing this just because it looks nicer in the UI.
                        currentFolderPermissions.permissions.unshift(currentIdentityPermission);
                    }
                }

                // Note that this can only happen with root folders. All other (child) folders will
                // always have at least one permission (inherited from parent).
                const mustAddPublicPermission = currentFolderPermissions.permissions.length === 0;
                if (mustAddPublicPermission) {
                    currentFolderPermissions.permissions = [
                        {
                            target: `admin:${identity.id}`,
                            level: "public",
                            inheritedFrom: "public"
                        }
                    ];
                }

                processedFolderPermissions.push(currentFolderPermissions);
            };

            for (let i = 0; i < allFolders!.length; i++) {
                const folder = allFolders![i];
                processFolderPermissions(folder);
            }

            resolve(processedFolderPermissions);
            return;
            //return processedFolderPermissions;
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
        const currentIdentityPermission = folderPermissions?.permissions.find(p => {
            return p.target === `admin:${identity.id}`;
        });

        if (!currentIdentityPermission) {
            return false;
        }

        const { level } = currentIdentityPermission;

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
}
